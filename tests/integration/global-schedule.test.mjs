import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client.ts";
import { createGlobalScheduleGet } from "../../lib/server/global-schedule-api.ts";
import { createScheduleGet } from "../../lib/server/schedule-api.ts";

const date = (value) => new Date(`${value}T00:00:00Z`);

test("global and student APIs read only their published kind from PostgreSQL", async () => {
  assert.equal(process.env.ALLOW_DB_TESTS, "1");
  const connectionString = process.env.DATABASE_URL;
  assert.ok(connectionString);
  assert.match(
    new URL(connectionString).pathname,
    /^\/studyflow_import_test_[a-zA-Z0-9_]+$/,
  );
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const prefix = `global-test-${randomUUID()}`;
  const id = (name) => `${prefix}-${name}`;
  const ids = {
    year: id("year"),
    semester: id("semester"),
    g1: id("g1"),
    g2: id("g2"),
    subject: id("subject"),
    user: id("user"),
    global: id("global"),
    student: id("student"),
    conflict: id("conflict"),
  };
  try {
    await db.academicYear.create({
      data: {
        id: ids.year,
        name: ids.year,
        startsOn: date("2026-09-01"),
        endsOn: date("2027-08-31"),
        firstOddWeekMonday: date("2026-08-31"),
        semesters: {
          create: {
            id: ids.semester,
            number: 1,
            startsOn: date("2026-09-01"),
            endsOn: date("2026-12-31"),
          },
        },
      },
    });
    await db.studyGroup.createMany({
      data: [
        { id: ids.g1, name: ids.g1 },
        { id: ids.g2, name: ids.g2 },
      ],
    });
    await db.subject.create({
      data: { id: ids.subject, name: ids.subject, colorKey: "blue" },
    });
    await db.user.create({
      data: {
        id: ids.user,
        email: `${ids.user}@example.invalid`,
        name: "Schedule Test",
        password: "unused",
        groupId: ids.g1,
      },
    });
    const base = {
      semesterId: ids.semester,
      course: 3,
      title: "Integration test",
      status: "PUBLISHED",
      validFrom: date("2026-09-01"),
      validTo: date("2026-12-31"),
    };
    await db.scheduleImport.create({
      data: {
        ...base,
        id: ids.global,
        kind: "GLOBAL",
        holidays: {
          create: {
            name: "Выходной",
            startsOn: date("2026-09-16"),
            endsOn: date("2026-09-16"),
          },
        },
        lessons: {
          create: {
            subjectId: ids.subject,
            weekday: 0,
            startMinutes: 585,
            endMinutes: 675,
            weekPattern: "ODD",
            audiences: {
              create: [{ groupId: ids.g1 }, { groupId: ids.g2 }],
            },
          },
        },
      },
    });
    await db.scheduleImport.create({
      data: {
        ...base,
        id: ids.student,
        kind: "STUDENT",
        lessons: {
          create: {
            subjectId: ids.subject,
            weekday: 0,
            startMinutes: 675,
            endMinutes: 765,
            audiences: { create: { groupId: ids.g1 } },
          },
        },
      },
    });

    const authenticate = async () => ({ user: { id: ids.user } });
    const globalGet = createGlobalScheduleGet({ authenticate, db });
    const studentGet = createScheduleGet({ authenticate, db });
    const globalResponse = await globalGet(
      new Request(
        "http://localhost/api/schedule/global?course=3&from=2026-09-14&to=2026-09-20",
      ),
    );
    assert.equal(globalResponse.status, 200);
    const globalBody = await globalResponse.json();
    assert.deepEqual(
      globalBody.groups.map((group) => group.id),
      [ids.g1, ids.g2],
    );
    assert.equal(globalBody.days[0].lessons.length, 1);
    assert.deepEqual(globalBody.days[0].lessons[0].groupIds, [ids.g1, ids.g2]);
    assert.deepEqual(
      globalBody.days[2].groupStates.map((state) => state.status),
      ["HOLIDAY", "HOLIDAY"],
    );
    const studentResponse = await studentGet(
      new Request(
        "http://localhost/api/schedule?from=2026-09-14&to=2026-09-14",
      ),
    );
    assert.equal(studentResponse.status, 200);
    const studentBody = await studentResponse.json();
    assert.equal(studentBody.days[0].lessons.length, 1);
    assert.equal(studentBody.days[0].lessons[0].startMinutes, 675);

    await db.scheduleImport.create({
      data: {
        ...base,
        id: ids.conflict,
        kind: "GLOBAL",
        lessons: {
          create: {
            subjectId: ids.subject,
            weekday: 0,
            startMinutes: 480,
            endMinutes: 570,
            audiences: { create: { groupId: ids.g1 } },
          },
        },
      },
    });
    const conflict = await globalGet(
      new Request(
        "http://localhost/api/schedule/global?course=3&from=2026-09-14&to=2026-09-14",
      ),
    );
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).code, "SCHEDULE_CONFLICT");
  } finally {
    await db.scheduleImport.deleteMany({
      where: { id: { in: [ids.global, ids.student, ids.conflict] } },
    });
    await db.user.deleteMany({ where: { id: ids.user } });
    await db.subject.deleteMany({ where: { id: ids.subject } });
    await db.studyGroup.deleteMany({ where: { id: { in: [ids.g1, ids.g2] } } });
    await db.semester.deleteMany({ where: { id: ids.semester } });
    await db.academicYear.deleteMany({ where: { id: ids.year } });
    await db.$disconnect();
  }
});
