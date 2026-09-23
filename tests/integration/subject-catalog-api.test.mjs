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
      schedules: { total: 0, published: 0, drafts: 0 },
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
    // Existing imports are linked through lessons, not inferred from names.
    await db.academicYear.create({
      data: {
        id,
        name: id,
        startsOn: new Date("2026-09-01"),
        endsOn: new Date("2027-08-31"),
        firstOddWeekMonday: new Date("2026-08-31"),
        semesters: {
          create: {
            id,
            number: 1,
            startsOn: new Date("2026-09-01"),
            endsOn: new Date("2026-12-31"),
          },
        },
      },
    });
    await db.studyGroup.createMany({
      data: [
        { id: id + "-A", name: id + "-A" },
        { id: id + "-B", name: id + "-B" },
      ],
    });
    for (const [suffix, status] of [
      ["published", "PUBLISHED"],
      ["draft", "DRAFT"],
    ]) {
      await db.scheduleImport.create({
        data: {
          id: id + suffix,
          semesterId: id,
          course: 1,
          title: suffix,
          status,
          validFrom: new Date("2026-09-01"),
          validTo: new Date("2026-12-31"),
        },
      });
    }
    const other = await db.subject.create({ data: { name: id + "other" } });
    ids.push(other.id);
    for (const [suffix, schedule, subjectId, teacher, group] of [
      ["1", "draft", subject.id, " Teacher A ", "A"],
      ["2", "draft", subject.id, "Teacher A", "A"],
      ["3", "published", subject.id, null, "B"],
      ["4", "draft", other.id, "Unrelated teacher", "B"],
    ]) {
      await db.lesson.create({
        data: {
          id: id + suffix,
          subjectId,
          scheduleId: id + schedule,
          weekday: 0,
          startMinutes: 480,
          endMinutes: 570,
          teacher,
          audiences: { create: { groupId: id + "-" + group } },
        },
      });
    }
    const linked = (await (await api.GET(request("GET"))).json()).find(
      (s) => s.id === subject.id,
    );
    assert.deepEqual(linked.schedules, { total: 2, published: 1, drafts: 1 });
    const detail = await (await api.DETAIL(request("GET"), subject.id)).json();
    const draft = detail.relatedSchedules.find((s) => s.status === "DRAFT");
    assert.equal(draft.lessonCount, 2);
    assert.deepEqual(draft.groups, [id + "-A"]);
    assert.deepEqual(draft.teachers, ["Teacher A"]);
    assert.equal(draft.academicYear, id);
    assert.equal(draft.semester, 1);
    assert.equal(draft.validFrom, "2026-09-01");
    assert.deepEqual(
      detail.relatedSchedules.find((s) => s.status === "PUBLISHED").teachers,
      [],
    );
    assert.equal(
      (await api.DETAIL(request("GET"), "missing-subject")).status,
      404,
    );
    await db.scheduleImport.update({
      where: { id: id + "published" },
      data: { status: "DRAFT" },
    });
    const draftOnly = await (
      await api.DETAIL(request("GET"), subject.id)
    ).json();
    assert.deepEqual(draftOnly.schedules, {
      total: 2,
      published: 0,
      drafts: 2,
    });
    await db.user.update({ where: { id }, data: { role: "STUDENT" } });
    assert.equal((await api.GET(request("GET"))).status, 403);
    assert.equal((await api.DETAIL(request("GET"), subject.id)).status, 403);
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
    await db.scheduleImport.deleteMany({
      where: { id: { in: [id + "published", id + "draft"] } },
    });
    await db.semester.deleteMany({ where: { id } });
    await db.academicYear.deleteMany({ where: { id } });
    await db.studyGroup.deleteMany({
      where: { id: { in: [id + "-A", id + "-B"] } },
    });
    await db.subject.deleteMany({ where: { id: { in: ids } } });
    await db.user.deleteMany({ where: { id } });
    await db.$disconnect();
  }
});
