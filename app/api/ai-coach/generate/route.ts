import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/byok";
import {
  addTopicQuestions,
  DIFFICULTY_BY_LEVEL,
  listTopicQuestions,
  shuffle,
  toClientQuestion,
  type NewQuestion,
} from "@/lib/server/question-bank";
import mammoth from "mammoth";

// ---------------------------------------------------------------------------
// Gemini types
// ---------------------------------------------------------------------------

type GeminiPart =
  { text: string } | { inline_data: { mime_type: string; data: string } };

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
// Constants
// ---------------------------------------------------------------------------

const MAX_TEXT_LENGTH = 6_000;
const MAX_PER_LEVEL = 13;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const INLINE_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callGemini(
  apiKey: string,
  parts: GeminiPart[],
): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
  });

  if (res.status === 429 || res.status === 503) {
    const body = await res.text();
    console.error(`[Gemini] ${res.status}\n${body}`);
    const err = new Error("RATE_LIMITED") as Error & {
      status: number;
      retryAfter: number;
    };
    err.status = 429;
    err.retryAfter = parseInt(res.headers.get("Retry-After") ?? "30", 10);
    throw err;
  }
  if (!res.ok) {
    const body = await res.text();
    console.error(`[Gemini] ${res.status} ${GEMINI_URL}\n${body}`);
    const err = new Error(`Gemini error ${res.status}`) as Error & {
      geminiStatus: number;
      invalidKey: boolean;
    };
    err.geminiStatus = res.status;
    // Gemini answers 400 both for a bad key and for a malformed request
    // (e.g. an oversized attachment); tell them apart by the error reason.
    err.invalidKey =
      res.status === 401 ||
      res.status === 403 ||
      (res.status === 400 && /API[_ ]KEY/i.test(body));
    throw err;
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

// ---------------------------------------------------------------------------
// Prompt builders — return GeminiPart[] for multimodal support
// ---------------------------------------------------------------------------

function buildClassificationParts(
  subjects: { id: string; name: string; code: string }[],
  textContent: string,
  visualParts: Array<{ mime_type: string; data: string }>,
): GeminiPart[] {
  const subjectList = subjects
    .map((s) => `- ID: ${s.id}, Name: ${s.name} (${s.code})`)
    .join("\n");
  const hasText = textContent.trim().length > 0;
  const hasVisual = visualParts.length > 0;

  const materialSection = hasText
    ? `Material:\n---\n${textContent}\n---`
    : hasVisual
      ? "Material: [See attached file(s) below]"
      : "";

  const parts: GeminiPart[] = [
    {
      text: `You are a university curriculum classifier for the Technical University of Moldova (UTM).

Official faculty subjects:
${subjectList}

Analyze the student material and determine:
1. Which subject it belongs to (must match a listed subject)
2. The specific topic covered (concise, 3-7 words)

If the material is NOT genuine academic content related to a listed subject, reject it.

${materialSection}

Respond ONLY with valid JSON:
{"subjectId":"<id>","topicName":"<topic>"}
OR
{"rejected":true,"reason":"<explanation in Russian>"}`,
    },
  ];

  for (const vp of visualParts) {
    parts.push({ inline_data: vp });
  }

  return parts;
}

function buildGenerationParts(
  subjectName: string,
  topicName: string,
  existingQuestions: string[],
  textContent: string,
  visualParts: Array<{ mime_type: string; data: string }>,
  questionsPerLevel: number,
): GeminiPart[] {
  const dedupeBlock =
    existingQuestions.length > 0
      ? `\nExisting questions — DO NOT duplicate them:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
      : "";

  const hasText = textContent.trim().length > 0;
  const hasVisual = visualParts.length > 0;

  const materialSection = hasText
    ? `Student material:\n---\n${textContent}\n---`
    : hasVisual
      ? "Student material: [See attached file(s) below — extract and use all educational content]"
      : "";

  const parts: GeminiPart[] = [
    {
      text: `You are a university quiz generator for the Technical University of Moldova.

Subject: ${subjectName}
Topic: ${topicName}
${dedupeBlock}
${materialSection}

Generate exactly ${questionsPerLevel} questions for EACH difficulty level (easy, medium, hard).
All questions must be in Russian and based strictly on the material provided.

Respond ONLY with valid JSON:
{"easy":[...],"medium":[...],"hard":[...]}

Question formats:
- MULTIPLE_CHOICE: {"text":"...","type":"MULTIPLE_CHOICE","options":[{"text":"...","isCorrect":true},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false}]}
- TRUE_FALSE: {"text":"...","type":"TRUE_FALSE","options":[{"text":"Верно","isCorrect":true},{"text":"Неверно","isCorrect":false}]}

Rules:
- MULTIPLE_CHOICE: exactly 4 options, exactly 1 isCorrect=true
- TRUE_FALSE: exactly 2 options ("Верно"/"Неверно"), exactly 1 isCorrect=true
- No duplicate questions within or across levels`,
    },
  ];

  for (const vp of visualParts) {
    parts.push({ inline_data: vp });
  }

  return parts;
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

  // [2] Parse FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data" }, { status: 400 });
  }

  const textContent = String(formData.get("text") ?? "").slice(
    0,
    MAX_TEXT_LENGTH,
  );
  const questionCount = Math.max(
    1,
    Math.min(
      100,
      parseInt(String(formData.get("questionCount") ?? "5"), 10) || 5,
    ),
  );
  const difficulty = String(formData.get("difficulty") ?? "medium") as
    "easy" | "medium" | "hard" | "any";
  const rawFiles = formData.getAll("file");
  const files = rawFiles.filter(
    (v): v is File =>
      v instanceof File && v.size > 0 && v.size <= MAX_FILE_SIZE,
  );

  // [3] Process files — extract text from TXT/DOCX, keep PDF/images as visual
  let extractedText = "";
  const visualParts: Array<{ mime_type: string; data: string }> = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.toLowerCase();

    if (file.type === "text/plain" || ext.endsWith(".txt")) {
      extractedText +=
        buffer.toString("utf-8").slice(0, MAX_TEXT_LENGTH) + "\n";
    } else if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext.endsWith(".docx")
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText += result.value.slice(0, MAX_TEXT_LENGTH) + "\n";
      } catch (err) {
        console.error("[DOCX] extraction failed:", err);
      }
    } else if (INLINE_MIME_TYPES.has(file.type)) {
      visualParts.push({
        mime_type: file.type,
        data: buffer.toString("base64"),
      });
    }
  }

  // Combine typed text + extracted text
  const combinedText = [textContent, extractedText]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_TEXT_LENGTH);

  // [4] Require at least some content
  if (!combinedText && visualParts.length === 0) {
    return NextResponse.json(
      { message: "Добавьте текст материала или прикрепите файл" },
      { status: 400 },
    );
  }

  // [5] BYOK — decrypt API key
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

  // [6] Load subject registry
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

  // [7] Gemini Step 1 — classify
  let classificationRaw: string;
  try {
    classificationRaw = await callGemini(
      apiKey,
      buildClassificationParts(facultySubjects, combinedText, visualParts),
    );
  } catch (err) {
    return handleGeminiError(err);
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

  // [8] Upsert topic (globally unique by name) and ensure it's linked to the classified subject
  const topic = await prisma.topic.upsert({
    where: { name: topicName },
    create: {
      name: topicName,
      subjects: { connect: { id: subjectId } },
    },
    update: {
      subjects: { connect: { id: subjectId } },
    },
  });
  const existingQuestions = await listTopicQuestions(prisma, [topic.id]);
  const isNewTopic = existingQuestions.length === 0;

  // [9] Create Document record
  const document = await prisma.document.create({
    data: {
      userId,
      fileName: files[0]?.name ?? null,
      textContent: combinedText || "[visual input]",
      subjectId,
      topicId: topic.id,
      status: "PROCESSING",
    },
  });

  // [10] Gemini Step 2 — generate questions
  let generationRaw: string;
  try {
    generationRaw = await callGemini(
      apiKey,
      buildGenerationParts(
        resolvedSubject.name,
        topicName,
        existingQuestions.map((q) => q.text),
        combinedText,
        visualParts,
        MAX_PER_LEVEL,
      ),
    );
  } catch (err) {
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "REJECTED", errorMessage: String(err) },
    });
    return handleGeminiError(err);
  }

  let generated: GeminiQuestions;
  try {
    generated = JSON.parse(generationRaw) as GeminiQuestions;
    if (
      !Array.isArray(generated.easy) ||
      !Array.isArray(generated.medium) ||
      !Array.isArray(generated.hard)
    )
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

  // [11] Persist to the question bank; duplicates and malformed items are skipped there
  const candidates: NewQuestion[] = [
    ...generated.easy.map((q) => ({ ...q, difficulty: "EASY" as const })),
    ...generated.medium.map((q) => ({ ...q, difficulty: "MEDIUM" as const })),
    ...generated.hard.map((q) => ({ ...q, difficulty: "HARD" as const })),
  ].filter(
    (q) =>
      typeof q.text === "string" &&
      (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") &&
      Array.isArray(q.options),
  );
  const { saved, skipped } = await addTopicQuestions(
    prisma,
    topic.id,
    candidates,
  );
  const allQuestions = [...existingQuestions, ...saved];

  await prisma.document.update({
    where: { id: document.id },
    data: { status: "DONE" },
  });

  // [12] Build display pool — "any" returns a random mix of all difficulties
  const pool = shuffle(
    difficulty === "any"
      ? allQuestions
      : allQuestions.filter(
          (q) => q.difficulty === (DIFFICULTY_BY_LEVEL[difficulty] ?? "MEDIUM"),
        ),
  );
  const displayQuestions = pool.slice(0, questionCount);

  if (displayQuestions.length === 0) {
    return NextResponse.json(
      {
        message:
          "Вопросы сохранены, но ни один не подходит под выбранную сложность — попробуйте изменить настройки",
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    topicId: topic.id,
    topicName: topic.name,
    subjectId,
    subjectName: resolvedSubject.name,
    isNewTopic,
    documentId: document.id,
    totalSaved: saved.length,
    skippedAsDuplicates: skipped,
    questions: displayQuestions.map(toClientQuestion),
  });
}

// ---------------------------------------------------------------------------
// Shared Gemini error handler
// ---------------------------------------------------------------------------

function handleGeminiError(err: unknown): NextResponse {
  const e = err as Error & {
    status?: number;
    retryAfter?: number;
    geminiStatus?: number;
    invalidKey?: boolean;
  };
  if (e.status === 429) {
    return NextResponse.json(
      { message: "RATE_LIMITED", retryAfter: e.retryAfter ?? 60 },
      { status: 503 },
    );
  }
  if (e.invalidKey) {
    return NextResponse.json({ message: "INVALID_API_KEY" }, { status: 502 });
  }
  if (e.geminiStatus === 400) {
    return NextResponse.json(
      {
        message:
          "Gemini отклонил запрос — уменьшите объём материала или вложений",
      },
      { status: 502 },
    );
  }
  if (e.geminiStatus === 404) {
    return NextResponse.json(
      { message: `Модель Gemini не найдена: ${GEMINI_MODEL}` },
      { status: 502 },
    );
  }
  return NextResponse.json(
    { message: "Ошибка при обращении к Gemini" },
    { status: 502 },
  );
}
