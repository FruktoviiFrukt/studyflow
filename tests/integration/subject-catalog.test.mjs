import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client.ts";

test("subject catalog preserves name-only imports and archived metadata", async () => {
  assert.equal(
    process.env.ALLOW_DB_TESTS,
    "1",
    "Use an isolated test database and set ALLOW_DB_TESTS=1",
  );
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const prefix = `subject-catalog-${randomUUID()}`;
  const ids = [prefix + "-1", prefix + "-2", prefix + "-duplicate"];
  try {
    for (const id of ids.slice(0, 2)) {
      const subject = await db.subject.create({ data: { id, name: id } });
      assert.equal(subject.status, "ACTIVE");
      assert.equal(subject.code, null);
      assert.equal(subject.faculty, null);
      assert.equal(subject.colorKey, "blue");
    }
    await db.subject.update({
      where: { id: ids[0] },
      data: { code: prefix, faculty: "FCIM", status: "ARCHIVED" },
    });
    // Match the schedule import's upsert: importing again must not reactivate
    // the subject or discard administrator-supplied catalog fields.
    const imported = await db.subject.upsert({
      where: { name: ids[0] },
      update: {},
      create: { name: ids[0] },
    });
    assert.equal(imported.id, ids[0]);
    assert.equal(imported.status, "ARCHIVED");
    assert.equal(imported.code, prefix);
    assert.equal(imported.faculty, "FCIM");
    await assert.rejects(
      () =>
        db.subject.create({ data: { id: ids[2], name: ids[2], code: prefix } }),
      { code: "P2002" },
    );
    await db.subject.update({
      where: { id: ids[0] },
      data: { status: "ACTIVE" },
    });
    assert.equal(
      (await db.subject.findUniqueOrThrow({ where: { id: ids[0] } })).status,
      "ACTIVE",
    );
  } finally {
    await db.subject.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  }
});
