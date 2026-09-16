import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/byok";
import { Difficulty, QuestionType } from "@/lib/generated/prisma/client";

// ---------------------------------------------------------------------------
// Request / response shapes
// ---------------------------------------------------------------------------

type GenerateRequest = {
  textContent: string;
  fileName?: string;
  questionCount?: number;
};

type GeminiOption = { text: string; isCorrect: boolean };
type GeminiQuestion = {
  text: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  options: GeminiOption[];
};
type GeminiQuestions = {
  easy: GeminiQuestion[];
  medium: GeminiQuestion[];
  hard: GeminiQuestion[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_TEXT_LENGTH = 8_000;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function textHash(text: string): string {
  return createHash("sha256").update(normalizeText(text)).digest("hex");
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
  });

  if (res.status === 429) {
    const err = new Error("RATE_LIMITED") as Error & {
      status: number;
      retryAfter: number;
    };
    err.status = 429;
    const retryHeader = res.headers.get("Retry-After");
    err.retryAfter = retryHeader ? parseInt(retryHeader, 10) : 60;
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

function buildClassificationPrompt(
  subjects: { id: string; name: string; code: string }[],
  textContent: string,
): string {
  return `You are a university curriculum classifier for the Technical University of Moldova (UTM).

Official faculty subjects:
${subjects.map((s) => `- ID: ${s.id}, Name: ${s.name} (${s.code})`).join("\n")}

Analyze the student material below and determine:
1. Which subject it belongs to (must match a listed subject)
2. The specific topic covered (concise, 3-7 words)

If the material is NOT genuine academic content related to a listed subject (e.g. recipes, personal text, unrelated content), reject it.

Material:
---
${textContent}
---

Respond ONLY with valid JSON:
{"subjectId":"<id>","topicName":"<topic>"}
OR
{"rejected":true,"reason":"<explanation in Russian>"}`;
}

function buildGenerationPrompt(
  subjectName: string,
  topicName: string,
  existingQuestions: string[],
  textContent: string,
  questionsPerLevel: number,
): string {
  const dedupeBlock =
    existingQuestions.length > 0
      ? `\nExisting questions — DO NOT duplicate them:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
      : "";

  return `You are a university quiz generator for the Technical University of Moldova.

Subject: ${subjectName}
Topic: ${topicName}
${dedupeBlock}
Student material:
---
${textContent}
---

Generate exactly ${questionsPerLevel} questions for EACH difficulty level (easy, medium, hard).
All questions must be in Russian and based strictly on the material above.

Respond ONLY with valid JSON:
{
  "easy":   [{"text":"...","type":"MULTIPLE_CHOICE","options":[{"text":"...","isCorrect":true},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false}]}, {"text":"...","type":"TRUE_FALSE","options":[{"text":"Верно","isCorrect":true},{"text":"Неверно","isCorrect":false}]}],
  "medium": [...],
  "hard":   [...]
}

Rules:
- MULTIPLE_CHOICE: exactly 4 options, exactly 1 isCorrect=true
- TRUE_FALSE: exactly 2 options ("Верно"/"Неверно"), exactly 1 isCorrect=true
- No duplicate questions within or across levels`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // [1] Auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // [2] Parse + validate body
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { textContent, fileName, questionCount = 10 } = body;

  if (typeof textContent !== "string" || textContent.trim().length < 50) {
    return NextResponse.json(
      { message: "Текст материала слишком короткий (минимум 50 символов)" },
      { status: 400 },
    );
  }
  if (questionCount < 10 || questionCount > 100) {
    return NextResponse.json(
      { message: "Количество вопросов должно быть от 10 до 100" },
      { status: 400 },
    );
  }

  const safeText = textContent.slice(0, MAX_TEXT_LENGTH);

  // [3] BYOK — load and decrypt API key
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKey: true },
  });

  if (!user?.geminiApiKey) {
    return NextResponse.json({ message: "API_KEY_REQUIRED" }, { status: 402 });
  }

  let apiKey: string;
  try {
    apiKey = decryptApiKey(user.geminiApiKey);
  } catch {
    return NextResponse.json(
      { message: "Не удалось расшифровать API-ключ" },
      { status: 500 },
    );
  }

  // [4] Load official subject registry
  const facultySubjects = await prisma.facultySubject.findMany({
    where: { active: true },
    select: { id: true, name: true, code: true },
  });

  if (facultySubjects.length === 0) {
    return NextResponse.json(
      { message: "Реестр предметов пуст — обратитесь к администратору" },
      { status: 503 },
    );
  }

  // [5] Gemini Step 1 — classify document
  let classificationRaw: string;
  try {
    classificationRaw = await callGemini(
      apiKey,
      buildClassificationPrompt(facultySubjects, safeText),
    );
  } catch (err) {
    const e = err as Error & { status?: number; retryAfter?: number };
    if (e.status === 429) {
      return NextResponse.json(
        { message: "RATE_LIMITED", retryAfter: e.retryAfter ?? 60 },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { message: "Ошибка при обращении к Gemini" },
      { status: 502 },
    );
  }

  let classification: {
    subjectId?: string;
    topicName?: string;
    rejected?: boolean;
    reason?: string;
  };
  try {
    classification = JSON.parse(classificationRaw) as typeof classification;
  } catch {
    return NextResponse.json(
      { message: "Gemini вернул некорректный JSON при классификации" },
      { status: 502 },
    );
  }

  if (classification.rejected) {
    return NextResponse.json(
      {
        message: "IRRELEVANT_CONTENT",
        reason:
          classification.reason ??
          "Материал не относится к учебной программе факультета",
      },
      { status: 422 },
    );
  }

  const { subjectId, topicName } = classification;
  if (!subjectId || !topicName) {
    return NextResponse.json(
      { message: "Gemini не смог определить предмет или тему" },
      { status: 422 },
    );
  }

  const resolvedSubject = facultySubjects.find((s) => s.id === subjectId);
  if (!resolvedSubject) {
    return NextResponse.json(
      { message: "Gemini вернул неизвестный ID предмета" },
      { status: 422 },
    );
  }

  // [6] Find or init topic; load existing questions for deduplication
  const existingTopic = await prisma.topic.findUnique({
    where: { subjectId_name: { subjectId, name: topicName } },
    select: {
      id: true,
      questions: { select: { text: true } },
    },
  });

  const isNewTopic = existingTopic === null;
  const existingQuestions = existingTopic?.questions.map((q) => q.text) ?? [];

  // [7] Create Document record to track the pipeline run
  const document = await prisma.document.create({
    data: {
      userId,
      fileName: typeof fileName === "string" ? fileName : null,
      textContent: safeText,
      subjectId,
      status: "PROCESSING",
    },
  });

  // [8] Gemini Step 2 — generate questions
  const questionsPerLevel = Math.ceil(questionCount / 3);
  let generationRaw: string;
  try {
    generationRaw = await callGemini(
      apiKey,
      buildGenerationPrompt(
        resolvedSubject.name,
        topicName,
        existingQuestions,
        safeText,
        questionsPerLevel,
      ),
    );
  } catch (err) {
    const e = err as Error & { status?: number; retryAfter?: number };
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "REJECTED", errorMessage: e.message },
    });
    if (e.status === 429) {
      return NextResponse.json(
        { message: "RATE_LIMITED", retryAfter: e.retryAfter ?? 60 },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { message: "Ошибка при генерации вопросов" },
      { status: 502 },
    );
  }

  let generated: GeminiQuestions;
  try {
    generated = JSON.parse(generationRaw) as GeminiQuestions;
    if (!generated.easy || !generated.medium || !generated.hard)
      throw new Error();
  } catch {
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "REJECTED", errorMessage: "Invalid generation JSON" },
    });
    return NextResponse.json(
      { message: "Gemini вернул некорректный формат вопросов" },
      { status: 502 },
    );
  }

  // [9] Dedup via textHash — filter questions already in DB
  const allGenerated: { q: GeminiQuestion; difficulty: Difficulty }[] = [
    ...generated.easy.map((q) => ({ q, difficulty: "EASY" as Difficulty })),
    ...generated.medium.map((q) => ({ q, difficulty: "MEDIUM" as Difficulty })),
    ...generated.hard.map((q) => ({ q, difficulty: "HARD" as Difficulty })),
  ];

  const hashes = allGenerated.map(({ q }) => textHash(q.text));
  const existingHashes = new Set(
    (
      await prisma.question.findMany({
        where: { textHash: { in: hashes } },
        select: { textHash: true },
      })
    ).map((q) => q.textHash),
  );

  const unique = allGenerated.filter(
    ({ q }) => !existingHashes.has(textHash(q.text)),
  );
  const skippedAsDuplicates = allGenerated.length - unique.length;

  // [10] Persist in a transaction
  const { topic, savedQuestions } = await prisma.$transaction(async (tx) => {
    const topic = await tx.topic.upsert({
      where: { subjectId_name: { subjectId, name: topicName } },
      create: { subjectId, name: topicName },
      update: {},
    });

    await tx.document.update({
      where: { id: document.id },
      data: { topicId: topic.id, status: "DONE" },
    });

    const savedQuestions = await Promise.all(
      unique.map(({ q, difficulty }) =>
        tx.question.create({
          data: {
            text: q.text,
            textHash: textHash(q.text),
            type: q.type as QuestionType,
            difficulty,
            topicId: topic.id,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            },
          },
          include: { options: true },
        }),
      ),
    );

    return { topic, savedQuestions };
  });

  // [11] Build response grouped by difficulty
  const byDifficulty = (d: Difficulty) =>
    savedQuestions
      .filter((q) => q.difficulty === d)
      .map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
      }));

  return NextResponse.json(
    {
      topicId: topic.id,
      topicName: topic.name,
      subjectId,
      subjectName: resolvedSubject.name,
      isNewTopic,
      documentId: document.id,
      skippedAsDuplicates,
      questions: {
        easy: byDifficulty("EASY"),
        medium: byDifficulty("MEDIUM"),
        hard: byDifficulty("HARD"),
      },
    },
    { status: 200 },
  );
}
