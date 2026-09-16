import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type StoredOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type StoredQuestion = {
  id: string;
  text: string;
  textHash: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: StoredOption[];
};

function topicFilePath(topicId: string): string {
  return path.join(process.cwd(), "data", "topics", `${topicId}.json`);
}

export function readTopicQuestions(topicId: string): StoredQuestion[] {
  const p = topicFilePath(topicId);
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as StoredQuestion[];
  } catch {
    return [];
  }
}

export function writeTopicQuestions(
  topicId: string,
  questions: StoredQuestion[],
): void {
  const p = topicFilePath(topicId);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(questions, null, 2), "utf-8");
}

export function countTopicQuestions(topicId: string) {
  const qs = readTopicQuestions(topicId);
  let easy = 0,
    medium = 0,
    hard = 0;
  for (const q of qs) {
    if (q.difficulty === "EASY") easy++;
    else if (q.difficulty === "MEDIUM") medium++;
    else hard++;
  }
  return { easy, medium, hard, total: qs.length };
}
