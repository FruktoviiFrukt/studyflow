import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client.ts";
import { createSubjectCatalogApi } from "../../lib/server/subject-catalog-api.ts";

test("catalog API persists edits and archive state, and rechecks administrator role", async () => {
  assert.equal(
    process.env.ALLOW_DB_TESTS,
    "1",
    "Use an isolated test database and set ALLOW_DB_TESTS=1",
  );
  assert.ok(process.env.DATABASE_URL);
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const id = `catalog-api-${randomUUID()}`;
  const ids = [];
  const api = createSubjectCatalogApi({
    authenticate: async () => ({ user: { id } }),
    db,
  });
  const request = (method, body) =>
    new Request("http://localhost/api/admin/subjects", {
      method,
      ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
    });
  try {
    await db.user.create({
      data: {
        id,
        name: "Test Admin",
        email: `${id}@example.invalid`,
        password: "unused",
        role: "ADMIN",
      },
    });
    const created = await api.POST(request("POST", { name: id }));
    assert.equal(created.status, 201);
    const subject = await created.json();
    ids.push(subject.id);
    assert.equal(subject.code, null);
    assert.equal(subject.status, "ACTIVE");
    const duplicate = await api.POST(
      request("POST", { name: id.toUpperCase() }),
    );
    assert.equal(duplicate.status, 409);
    const code = id.slice(0, 35).toUpperCase();
    assert.equal(
      (
        await api.PATCH(
          request("PATCH", { code, faculty: " fcim " }),
          subject.id,
        )
      ).status,
      200,
    );
    assert.equal(
      (await api.PATCH(request("PATCH", { status: "ARCHIVED" }), subject.id))
        .status,
      200,
    );
    const fresh = createSubjectCatalogApi({
      authenticate: async () => ({ user: { id } }),
      db,
    });
    const record = (await (await fresh.GET(request("GET"))).json()).find(
      (s) => s.id === subject.id,
    );
    assert.deepEqual(record, {
      id: subject.id,
      name: id,
      code,
      faculty: "FCIM",
      status: "ARCHIVED",
    });
    assert.equal(
      (
        await api.PATCH(
          request("PATCH", { status: "ACTIVE", code: null, faculty: "" }),
          subject.id,
        )
      ).status,
      200,
    );
    const restored = await db.subject.findUniqueOrThrow({
      where: { id: subject.id },
    });
    assert.equal(restored.status, "ACTIVE");
    assert.equal(restored.code, null);
    assert.equal(restored.faculty, null);
    await db.user.update({ where: { id }, data: { role: "STUDENT" } });
    assert.equal((await api.GET(request("GET"))).status, 403);
    assert.equal(
      (await api.PATCH(request("PATCH", { status: "ARCHIVED" }), subject.id))
        .status,
      403,
    );
    assert.equal(
      (await db.subject.findUniqueOrThrow({ where: { id: subject.id } }))
        .status,
      "ACTIVE",
    );
  } finally {
    await db.subject.deleteMany({ where: { id: { in: ids } } });
    await db.user.deleteMany({ where: { id } });
    await db.$disconnect();
  }
});
