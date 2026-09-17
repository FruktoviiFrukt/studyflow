import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client.ts";
import {
  addTopicQuestions,
  countQuestionsByTopic,
  listTopicQuestions,
} from "../../lib/server/question-bank.ts";

test("question bank stores questions with options, dedupes and counts per topic", async () => {
  assert.equal(
    process.env.ALLOW_DB_TESTS,
    "1",
    "Use an isolated test database and set ALLOW_DB_TESTS=1",
  );
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const prefix = `qbank-${randomUUID()}`;
  const mc = (text, difficulty = "EASY") => ({
    text,
    type: "MULTIPLE_CHOICE",
    difficulty,
    options: [
      { text: "a", isCorrect: true },
      { text: "b", isCorrect: false },
      { text: "c", isCorrect: false },
      { text: "d", isCorrect: false },
    ],
  });
  try {
    const subject = await prisma.facultySubject.create({
      data: { name: `${prefix} subject`, code: prefix, faculty: "TEST" },
    });
    const topicA = await prisma.topic.create({
      data: { name: `${prefix} A`, subjects: { connect: { id: subject.id } } },
    });
    const topicB = await prisma.topic.create({
      data: { name: `${prefix} B`, subjects: { connect: { id: subject.id } } },
    });

    const first = await addTopicQuestions(prisma, topicA.id, [
      mc(`${prefix} what is X?`),
      mc(`${prefix} WHAT IS X`), // same after normalization
      mc(`${prefix} what is Y?`, "HARD"),
      { ...mc(`${prefix} broken`), options: [] }, // malformed
    ]);
    assert.equal(first.saved.length, 2);
    assert.equal(first.skipped, 2);
    assert.equal(first.saved[0].topicName, topicA.name);
    assert.equal(first.saved[0].options.length, 4);

    // Same text under another topic is a global duplicate, not an error.
    const second = await addTopicQuestions(prisma, topicB.id, [
      mc(`${prefix} what is x`),
      mc(`${prefix} what is Z?`, "MEDIUM"),
    ]);
    assert.equal(second.saved.length, 1);
    assert.equal(second.skipped, 1);

    const listed = await listTopicQuestions(prisma, [topicA.id, topicB.id]);
    assert.equal(listed.length, 3);
    assert.ok(listed.every((q) => q.options.length === 4));

    const counts = await countQuestionsByTopic(prisma, [topicA.id, topicB.id]);
    assert.deepEqual(counts.get(topicA.id), {
      easy: 1,
      medium: 0,
      hard: 1,
      total: 2,
    });
    assert.deepEqual(counts.get(topicB.id), {
      easy: 0,
      medium: 1,
      hard: 0,
      total: 1,
    });

    // Deleting a question removes its options.
    await prisma.question.delete({ where: { id: first.saved[0].id } });
    assert.equal(
      await prisma.option.count({ where: { questionId: first.saved[0].id } }),
      0,
    );
  } finally {
    try {
      await prisma.question.deleteMany({
        where: {
          topicId: {
            in: (
              await prisma.topic.findMany({
                where: { name: { startsWith: prefix } },
                select: { id: true },
              })
            ).map((t) => t.id),
          },
        },
      });
      await prisma.topic.deleteMany({
        where: { name: { startsWith: prefix } },
      });
      await prisma.facultySubject.deleteMany({ where: { code: prefix } });
    } finally {
      await prisma.$disconnect();
    }
  }
});
