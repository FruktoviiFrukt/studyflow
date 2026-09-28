import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client.ts";
import { resolveImportSubjects } from "../../lib/server/subject-import.ts";
test("import decisions preserve metadata, reuse normalized names and reject stale or ambiguous mappings atomically", async () => {
  assert.equal(process.env.ALLOW_DB_TESTS, "1");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const prefix = "matching-" + randomUUID();
  try {
    const old = await db.subject.create({
      data: { name: prefix + " algebra", status: "ARCHIVED", ectsCredits: 4.5 },
    });
    const apply = (choices) =>
      db.$transaction((tx) => resolveImportSubjects(tx, choices));
    let result = await apply([
      { sourceName: "Линейная алгебра", subjectId: old.id },
    ]);
    assert.equal(result.get("Линейная алгебра").id, old.id);
    result = await apply([
      { sourceName: prefix.toUpperCase() + "  ALGEBRA ", subjectId: null },
    ]);
    assert.equal([...result.values()][0].id, old.id);
    const untouched = await db.subject.findUniqueOrThrow({
      where: { id: old.id },
    });
    assert.equal(untouched.status, "ARCHIVED");
    assert.equal(Number(untouched.ectsCredits), 4.5);
    const choices = [
      { sourceName: prefix + " new", subjectId: null },
      { sourceName: prefix + " NEW", subjectId: null },
      { sourceName: prefix + "new", subjectId: null },
    ];
    result = await apply(choices);
    assert.equal(new Set([...result.values()].map((s) => s.id)).size, 1);
    const repeated = await apply(choices);
    assert.deepEqual([...repeated.values()], [...result.values()]);
    await assert.rejects(
      () =>
        apply([
          { sourceName: prefix + " rollback", subjectId: null },
          { sourceName: "missing", subjectId: "missing" },
        ]),
      /больше не существует/,
    );
    assert.equal(
      await db.subject.count({ where: { name: prefix + " rollback" } }),
      0,
    );
    await db.subject.create({ data: { name: prefix + " ALGEBRA" } });
    await assert.rejects(
      () => apply([{ sourceName: prefix + " Algebra", subjectId: null }]),
      /несколько дисциплин/,
    );
  } finally {
    await db.subject.deleteMany({ where: { name: { startsWith: prefix } } });
    await db.$disconnect();
  }
});
