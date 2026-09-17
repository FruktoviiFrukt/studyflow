import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  DIFFICULTY_BY_LEVEL,
  listTopicQuestions,
  shuffle,
  toClientQuestion,
} from "@/lib/server/question-bank";

const MAX_TOPICS = 50;

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

  if (
    !Array.isArray(topicIds) ||
    topicIds.length === 0 ||
    topicIds.length > MAX_TOPICS ||
    !topicIds.every((id) => typeof id === "string" && id.length <= 64)
  ) {
    return NextResponse.json(
      { message: "Выберите хотя бы одну тему" },
      { status: 400 },
    );
  }

  const difficultyStr = String(difficulty ?? "medium");
  const isAny = difficultyStr === "any";
  const requestedDifficulty = isAny
    ? null
    : (DIFFICULTY_BY_LEVEL[difficultyStr] ?? "MEDIUM");
  const requestedCount =
    typeof count === "number" && count >= 1 ? Math.min(count, 100) : 5;

  const allQuestions = await listTopicQuestions(prisma, topicIds as string[]);

  const pool = shuffle(
    isAny
      ? allQuestions
      : allQuestions.filter((q) => q.difficulty === requestedDifficulty),
  );

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

  return NextResponse.json({
    questions: pool.slice(0, requestedCount).map(toClientQuestion),
  });
}
