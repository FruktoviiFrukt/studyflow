import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client.ts";

test("schedule relations, constraints, holidays and cascade deletion", async () => {
  assert.equal(
    process.env.ALLOW_DB_TESTS,
    "1",
    "Use an isolated test database and set ALLOW_DB_TESTS=1",
  );
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const prefix = `schedule-test-${randomUUID()}`;
  const id = (name) => `${prefix}-${name}`;
  const date = (value) => new Date(`${value}T00:00:00Z`);
  try {
    await prisma.academicYear.create({
      data: {
        id: id("year"),
        name: id("year"),
        startsOn: date("2026-09-01"),
        endsOn: date("2027-08-31"),
        firstOddWeekMonday: date("2026-08-31"),
        semesters: {
          create: {
            id: id("semester"),
            number: 1,
            startsOn: date("2026-09-01"),
            endsOn: date("2026-12-31"),
          },
        },
      },
    });
    for (const key of ["group1", "group2"]) {
      await prisma.studyGroup.create({
        data: {
          id: id(key),
          name: id(key),
          subgroups: { create: { id: id(`${key}-sub1`), number: 1 } },
        },
      });
    }
    await prisma.user.create({
      data: {
        id: id("student"),
        email: `${prefix}@example.invalid`,
        name: "Test",
        password: "test-placeholder",
        group: id("group1"),
      },
    });
    // The existing registration can still create a user without new relation IDs.
    await prisma.user.update({
      where: { id: id("student") },
      data: { groupId: id("group1"), subgroupId: id("group1-sub1") },
    });
    await assert.rejects(
      () =>
        prisma.user.update({
          where: { id: id("student") },
          data: { subgroupId: id("group2-sub1") },
        }),
      { code: "P2003" },
    );
    await assert.rejects(() =>
      prisma.user.update({
        where: { id: id("student") },
        data: { groupId: null },
      }),
    );
    await assert.rejects(() =>
      prisma.subgroup.create({ data: { groupId: id("group1"), number: 3 } }),
    );
    await prisma.subject.create({
      data: { id: id("subject"), name: id("subject") },
    });
    const schedule = await prisma.scheduleImport.create({
      data: {
        id: id("schedule"),
        semesterId: id("semester"),
        course: 1,
        title: "Test schedule",
        validFrom: date("2026-09-01"),
        validTo: date("2026-12-31"),
      },
    });
    assert.equal(schedule.status, "DRAFT");
    const lessonData = {
      scheduleId: id("schedule"),
      subjectId: id("subject"),
      weekday: 0,
      startMinutes: 1125,
      endMinutes: 1215,
    };
    const lesson = await prisma.lesson.create({
      data: {
        ...lessonData,
        id: id("lesson"),
        audiences: {
          create: [{ groupId: id("group1") }, { groupId: id("group2") }],
        },
      },
      include: { audiences: true },
    });
    assert.equal(lesson.audiences.length, 2);
    assert.equal(lesson.weekPattern, "EVERY");
    assert.equal(lesson.topic, null);
    await assert.rejects(
      () =>
        prisma.lessonAudience.create({
          data: { lessonId: lesson.id, groupId: id("group1") },
        }),
      { code: "P2002" },
    );
    await assert.rejects(
      () =>
        prisma.lessonAudience.create({
          data: {
            lessonId: lesson.id,
            groupId: id("group1"),
            subgroupId: id("group2-sub1"),
          },
        }),
      { code: "P2003" },
    );
    for (const patch of [
      { weekday: 7 },
      { startMinutes: -1 },
      { endMinutes: 1500 },
      { endMinutes: 1125 },
    ]) {
      await assert.rejects(() =>
        prisma.lesson.create({ data: { ...lessonData, ...patch } }),
      );
    }
    await prisma.scheduleHoliday.create({
      data: {
        id: id("holiday"),
        scheduleId: schedule.id,
        name: "One day",
        startsOn: date("2026-09-14"),
        endsOn: date("2026-09-14"),
      },
    });
    await prisma.scheduleHoliday.create({
      data: {
        scheduleId: schedule.id,
        name: "Overlapping range",
        startsOn: date("2026-09-14"),
        endsOn: date("2026-09-20"),
      },
    });
    await assert.rejects(() =>
      prisma.scheduleHoliday.create({
        data: {
          scheduleId: schedule.id,
          name: "Invalid",
          startsOn: date("2026-09-20"),
          endsOn: date("2026-09-14"),
        },
      }),
    );
    assert.equal(
      await prisma.lesson.count({ where: { scheduleId: schedule.id } }),
      1,
      "holidays do not delete weekly rules",
    );
    await assert.rejects(
      () => prisma.studyGroup.delete({ where: { id: id("group1") } }),
      { code: "P2003" },
    );
    await prisma.scheduleImport.delete({ where: { id: schedule.id } });
    assert.equal(
      await prisma.lesson.count({ where: { scheduleId: schedule.id } }),
      0,
    );
    assert.equal(
      await prisma.lessonAudience.count({ where: { lessonId: lesson.id } }),
      0,
    );
    assert.equal(
      await prisma.scheduleHoliday.count({
        where: { scheduleId: schedule.id },
      }),
      0,
    );
    assert.ok(await prisma.user.findUnique({ where: { id: id("student") } }));
    assert.ok(
      await prisma.subject.findUnique({ where: { id: id("subject") } }),
    );
  } finally {
    try {
      await prisma.scheduleImport.deleteMany({
        where: { semesterId: id("semester") },
      });
      await prisma.user.deleteMany({ where: { id: id("student") } });
      await prisma.subgroup.deleteMany({
        where: { groupId: { in: [id("group1"), id("group2")] } },
      });
      await prisma.studyGroup.deleteMany({
        where: { id: { in: [id("group1"), id("group2")] } },
      });
      await prisma.subject.deleteMany({ where: { id: id("subject") } });
      await prisma.semester.deleteMany({ where: { id: id("semester") } });
      await prisma.academicYear.deleteMany({ where: { id: id("year") } });
    } finally {
      await prisma.$disconnect();
    }
  }
});
