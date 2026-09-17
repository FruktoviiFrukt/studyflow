import { createHash } from "node:crypto";

import type {
  Difficulty,
  PrismaClient,
  QuestionType,
} from "../generated/prisma/client";

// Question bank persisted in the Question/Option tables. All functions take
// the client explicitly so integration tests can run them against a test DB.

export type StoredOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type StoredQuestion = {
  id: string;
  topicId: string;
  topicName: string;
  text: string;
  textHash: string;
  type: QuestionType;
  difficulty: Difficulty;
  options: StoredOption[];
};

export type NewQuestion = {
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  options: { text: string; isCorrect: boolean }[];
};

export type TopicQuestionCounts = {
  easy: number;
  medium: number;
  hard: number;
  total: number;
};

export const DIFFICULTY_BY_LEVEL: Record<string, Difficulty> = {
  easy: "EASY",
  medium: "MEDIUM",
  hard: "HARD",
};

/** Lowercases, strips punctuation and collapses whitespace so rewordings dedupe. */
export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function questionTextHash(text: string): string {
  return createHash("sha256").update(normalizeQuestionText(text)).digest("hex");
}

export function isWellFormedQuestion(q: NewQuestion): boolean {
  if (!q.text.trim()) return false;
  const correct = q.options.filter((o) => o.isCorrect).length;
  if (correct !== 1) return false;
  if (q.type === "TRUE_FALSE") return q.options.length === 2;
  return q.options.length === 4;
}

export async function listTopicQuestions(
  db: PrismaClient,
  topicIds: string[],
): Promise<StoredQuestion[]> {
  if (topicIds.length === 0) return [];
  const rows = await db.question.findMany({
    where: { topicId: { in: topicIds } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      topicId: true,
      text: true,
      textHash: true,
      type: true,
      difficulty: true,
      topic: { select: { name: true } },
      options: { select: { id: true, text: true, isCorrect: true } },
    },
  });
  return rows.map(({ topic, ...q }) => ({ ...q, topicName: topic.name }));
}

export async function countQuestionsByTopic(
  db: PrismaClient,
  topicIds: string[],
): Promise<Map<string, TopicQuestionCounts>> {
  const counts = new Map<string, TopicQuestionCounts>();
  if (topicIds.length === 0) return counts;
  const groups = await db.question.groupBy({
    by: ["topicId", "difficulty"],
    where: { topicId: { in: topicIds } },
    _count: { _all: true },
  });
  for (const g of groups) {
    const entry = counts.get(g.topicId) ?? {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0,
    };
    const n = g._count._all;
    if (g.difficulty === "EASY") entry.easy += n;
    else if (g.difficulty === "MEDIUM") entry.medium += n;
    else entry.hard += n;
    entry.total += n;
    counts.set(g.topicId, entry);
  }
  return counts;
}

/**
 * Stores the well-formed questions that are not already in the bank.
 * `textHash` is unique across all topics, so a question already saved under
 * another topic is treated as a duplicate rather than failing the insert.
 */
export async function addTopicQuestions(
  db: PrismaClient,
  topicId: string,
  candidates: NewQuestion[],
): Promise<{ saved: StoredQuestion[]; skipped: number }> {
  const wellFormed = candidates.filter(isWellFormedQuestion);
  const hashes = wellFormed.map((q) => questionTextHash(q.text));
  const existing = new Set(
    (
      await db.question.findMany({
        where: { textHash: { in: hashes } },
        select: { textHash: true },
      })
    ).map((q) => q.textHash),
  );

  const toInsert: { q: NewQuestion; hash: string }[] = [];
  wellFormed.forEach((q, i) => {
    const hash = hashes[i];
    if (existing.has(hash)) return;
    existing.add(hash);
    toInsert.push({ q, hash });
  });

  const saved = await db.$transaction(
    toInsert.map(({ q, hash }) =>
      db.question.create({
        data: {
          text: q.text,
          textHash: hash,
          type: q.type,
          difficulty: q.difficulty,
          topicId,
          options: {
            create: q.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          },
        },
        select: {
          id: true,
          topicId: true,
          text: true,
          textHash: true,
          type: true,
          difficulty: true,
          topic: { select: { name: true } },
          options: { select: { id: true, text: true, isCorrect: true } },
        },
      }),
    ),
  );

  return {
    saved: saved.map(({ topic, ...q }) => ({ ...q, topicName: topic.name })),
    skipped: candidates.length - saved.length,
  };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function toClientQuestion(q: StoredQuestion) {
  return {
    id: q.id,
    text: q.text,
    type: q.type,
    difficulty: q.difficulty,
    topicName: q.topicName,
    options: q.options,
  };
}
