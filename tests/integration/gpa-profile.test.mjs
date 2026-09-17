import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client.ts";

test("gpa profile is one per user, round-trips JSON and is removed with the user", async () => {
  assert.equal(
    process.env.ALLOW_DB_TESTS,
    "1",
    "Use an isolated test database and set ALLOW_DB_TESTS=1",
  );
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const userId = randomUUID();
  const subjects = [
    {
      id: "s1",
      name: "Математический анализ",
      semester: 1,
      formula: "g1 * 50% + g2 * 50%",
      stages: [
        { variable: "g1", name: "Аттестация 1", grade: "8" },
        { variable: "g2", name: "Экзамен", grade: "" },
      ],
    },
  ];
  try {
    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.invalid`,
        name: "GPA integration test",
        password: "test-only-placeholder",
      },
    });

    const created = await prisma.gpaProfile.upsert({
      where: { userId },
      update: { subjects },
      create: { userId, subjects },
    });
    assert.deepEqual(created.subjects, subjects);

    const updatedSubjects = [{ ...subjects[0], name: "Renamed" }];
    const updated = await prisma.gpaProfile.upsert({
      where: { userId },
      update: { subjects: updatedSubjects },
      create: { userId, subjects: updatedSubjects },
    });
    assert.equal(updated.id, created.id, "upsert must not create a second row");
    assert.deepEqual(updated.subjects, updatedSubjects);
    assert.ok(updated.updatedAt >= created.updatedAt);

    await assert.rejects(
      () => prisma.gpaProfile.create({ data: { userId, subjects } }),
      { code: "P2002" },
      "userId must be unique",
    );

    await prisma.user.delete({ where: { id: userId } });
    assert.equal(
      await prisma.gpaProfile.count({ where: { userId } }),
      0,
      "profile must cascade on user delete",
    );
  } finally {
    try {
      await prisma.user.deleteMany({ where: { id: userId } });
    } finally {
      await prisma.$disconnect();
    }
  }
});
