import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readTopicQuestions, type StoredQuestion } from "@/lib/questions-file";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DIFFICULTY_MAP: Record<string, StoredQuestion["difficulty"]> = {
  easy: "EASY",
  medium: "MEDIUM",
  hard: "HARD",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Не авторизовано" }, { status: 401 });
  }

  let body: { topicIds?: unknown; difficulty?: unknown; count?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { topicIds, difficulty, count } = body;

  if (!Array.isArray(topicIds) || topicIds.length === 0) {
    return NextResponse.json(
      { message: "Выберите хотя бы одну тему" },
      { status: 400 },
    );
  }

  const difficultyStr = String(difficulty ?? "medium");
  const isAny = difficultyStr === "any";
  const requestedDifficulty = isAny
    ? null
    : (DIFFICULTY_MAP[difficultyStr] ?? "MEDIUM");
  const requestedCount =
    typeof count === "number" && count >= 1 ? Math.min(count, 100) : 5;

  // Resolve topicIds → topic names from DB (subjectId no longer needed for file path)
  const topics = await prisma.topic.findMany({
    where: { id: { in: topicIds as string[] } },
    select: { id: true, name: true },
  });

  // Read questions from centralized JSON files
  type QuizQuestion = StoredQuestion & { topicName: string };
  const allQuestions: QuizQuestion[] = [];
  for (const t of topics) {
    const qs = readTopicQuestions(t.id);
    for (const q of qs) {
      allQuestions.push({ ...q, topicName: t.name });
    }
  }

  // Filter by difficulty (skip filter for "any")
  const pool = isAny
    ? shuffle(allQuestions)
    : shuffle(allQuestions.filter((q) => q.difficulty === requestedDifficulty));

  if (pool.length === 0) {
    return NextResponse.json(
      {
        message: isAny
          ? "Нет вопросов по выбранным темам — попробуйте сгенерировать новые"
          : "Нет вопросов для выбранной сложности — попробуйте изменить настройки или сгенерировать новые",
      },
      { status: 404 },
    );
  }

  const sampled = pool.slice(0, requestedCount);

  return NextResponse.json({
    questions: sampled.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      topicName: q.topicName,
      options: q.options,
    })),
  });
}
