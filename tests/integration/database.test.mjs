import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client.ts";

test("migrated database supports users, defaults and unique emails", async () => {
  assert.equal(
    process.env.ALLOW_DB_TESTS,
    "1",
    "Use an isolated test database and set ALLOW_DB_TESTS=1",
  );
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const id = randomUUID();
  try {
    const email = `${id}@example.invalid`;
    await prisma.user.create({
      data: {
        id,
        email,
        name: "Integration test",
        password: "test-only-placeholder",
      },
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    assert.equal(user.email, email);
    assert.equal(user.role, "STUDENT");
    await assert.rejects(
      async () =>
        prisma.user.create({
          data: { email, name: "Duplicate", password: "test-only-placeholder" },
        }),
      { code: "P2002" },
    );
  } finally {
    try {
      await prisma.user.deleteMany({ where: { id } });
    } finally {
      await prisma.$disconnect();
    }
  }
});
