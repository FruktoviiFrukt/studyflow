import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { randomUUID } from "node:crypto";

test("real PDF draft, access control, edit, holiday, publication and student API", async ({
  page,
  playwright,
}) => {
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.IMPORT_TEST_DATABASE_URL,
    }),
  });
  const baseURL = "http://127.0.0.1:3103";
  async function cookie(id: string) {
    return `authjs.session-token=${await encode({ secret: "import-test-secret-only", salt: "authjs.session-token", token: { id, sub: id, role: "ADMIN" } })}`;
  }
  const anon = await playwright.request.newContext({ baseURL });
  const admin = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Cookie: await cookie("import-admin") },
  });
  const student = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Cookie: await cookie("import-student") },
  });
  let id: string | undefined;
  try {
    for (const [userId, role] of [
      ["import-admin", "ADMIN"],
      ["import-student", "STUDENT"],
    ] as const)
      await db.user.upsert({
        where: { id: userId },
        update: { role },
        create: {
          id: userId,
          role,
          email: `${userId}@example.invalid`,
          name: userId,
          password: "test-unused",
        },
      });
    expect((await anon.get("/api/admin/schedule")).status()).toBe(401);
    expect((await student.get("/api/admin/schedule")).status()).toBe(403);
    const upload = await admin.post("/api/admin/schedule", {
      multipart: {
        kind: "STUDENT",
        year: "2026/2027",
        course: "1",
        semester: "1",
        from: "2026-09-01",
        to: "2026-12-31",
        first: "2026-08-31",
        file: {
          name: "schedule.pdf",
          mimeType: "application/pdf",
          buffer: await readFile(process.env.IMPORT_TEST_PDF!),
        },
      },
      timeout: 180000,
    });
    expect(upload.ok(), await upload.text()).toBe(true);
    let record = await upload.json();
    expect(record.kind).toBe("STUDENT");
    id = record.id;
    expect(record.lessons.length).toBeGreaterThan(100);
    expect(
      record.lessons.every((l: { reviewed: boolean }) => !l.reviewed),
    ).toBe(true);
    expect(
      record.lessons.some(
        (l: { subject: string; parity: string }) =>
          l.subject === "AM" && l.parity === "odd",
      ),
    ).toBe(true);
    expect((await student.get(record.sourceUrl)).status()).toBe(403);
    expect((await admin.get(record.sourceUrl)).headers()["content-type"]).toBe(
      "application/pdf",
    );
    const shared = record.lessons.find(
      (l: { audiences: unknown[]; subject: string }) =>
        l.audiences.length > 1 && l.subject.includes("Analiza"),
    );
    expect(shared).toBeTruthy();
    const lesson = {
      ...shared,
      id: "",
      subject: "Лекция из PDF",
      day: 0,
      start: "18:45",
      end: "20:15",
      parity: "every",
      reviewed: false,
      teacher: "Teacher",
      room: "611",
      audiences: [{ group: "SI-261", subgroup: "all" }],
    };
    const oldVersion = record.version;
    const saved = await admin.patch(`/api/admin/schedule/${id}`, {
      data: {
        action: "save",
        version: record.version,
        lessons: [lesson],
        holidays: [
          { name: "Каникулы", start: "2026-09-14", end: "2026-09-14" },
        ],
      },
    });
    expect(saved.ok(), await saved.text()).toBe(true);
    record = await saved.json();
    expect(
      (
        await admin.patch(`/api/admin/schedule/${id}`, {
          data: { action: "delete", version: oldVersion },
        })
      ).status(),
    ).toBe(409);
    const published = await admin.patch(`/api/admin/schedule/${id}`, {
      data: { action: "publish", version: record.version },
    });
    expect(published.ok(), await published.text()).toBe(true);
    record = await published.json();
    const group = await db.studyGroup.findUniqueOrThrow({
      where: { name: "SI-261" },
    });
    const original = await db.scheduleImport.findUniqueOrThrow({
      where: { id },
      include: { lessons: true },
    });
    const overlap = await db.scheduleImport.create({
      data: {
        title: "Conflicting test draft",
        semesterId: original.semesterId,
        course: 1,
        validFrom: original.validFrom,
        validTo: original.validTo,
        lessons: {
          create: {
            subjectId: original.lessons[0].subjectId,
            weekday: 0,
            startMinutes: 480,
            endMinutes: 570,
            reviewed: true,
            audiences: { create: { groupId: group.id } },
          },
        },
      },
    });
    try {
      expect(
        (
          await admin.patch(`/api/admin/schedule/${overlap.id}`, {
            data: {
              action: "publish",
              version: overlap.updatedAt.toISOString(),
            },
          })
        ).status(),
      ).toBe(409);
    } finally {
      await db.scheduleImport.delete({ where: { id: overlap.id } });
    }
    await db.user.update({
      where: { id: "import-student" },
      data: { groupId: group.id, subgroupId: null },
    });
    const holiday = await student.get(
      "/api/schedule?from=2026-09-14&to=2026-09-14",
    );
    expect((await holiday.json()).days[0].status).toBe("HOLIDAY");
    const lessons = await student.get(
      "/api/schedule?from=2026-09-21&to=2026-09-21",
    );
    expect((await lessons.json()).days[0].lessons[0].subject.name).toBe(
      "Лекция из PDF",
    );
    await page.context().addCookies([
      {
        name: "authjs.session-token",
        value: (await cookie("import-admin")).split("=")[1],
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    await page.goto("/admin/schedule");
    await page
      .getByRole("button", { name: "Открыть", exact: true })
      .first()
      .click();
    await expect(
      page.getByText("Проверенная лекция", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: ".review-output/admin-import-live.png",
      fullPage: true,
    });
    const unpublished = await admin.patch(`/api/admin/schedule/${id}`, {
      data: { action: "unpublish", version: record.version },
    });
    record = await unpublished.json();
    expect(
      (await student.get("/api/schedule?from=2026-09-21&to=2026-09-21")).ok(),
    ).toBe(true);
    expect(
      (
        await admin.patch(`/api/admin/schedule/${id}`, {
          data: { action: "delete", version: record.version },
        })
      ).ok(),
    ).toBe(true);
    id = undefined;
  } finally {
    if (id) await db.scheduleImport.deleteMany({ where: { id } });
    await db.$disconnect();
    await admin.dispose();
    await student.dispose();
    await anon.dispose();
  }
});

test("global publication is visible only in the global API and rejects overlaps", async ({
  playwright,
}) => {
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.IMPORT_TEST_DATABASE_URL,
    }),
  });
  const prefix = `global-http-${randomUUID()}`;
  const id = (name: string) => `${prefix}-${name}`;
  const date = (value: string) => new Date(`${value}T00:00:00Z`);
  const ids = {
    year: id("year"),
    semester: id("semester"),
    g1: id("g1"),
    g2: id("g2"),
    subject: id("subject"),
    admin: id("admin"),
    viewer: id("viewer"),
    global: id("global"),
    student: id("student"),
    overlap: id("overlap"),
  };
  async function cookie(userId: string) {
    const token = await encode({
      secret: "import-test-secret-only",
      salt: "authjs.session-token",
      token: {
        id: userId,
        sub: userId,
        role: userId === ids.admin ? "ADMIN" : "STUDENT",
      },
    });
    return `authjs.session-token=${token}`;
  }
  const baseURL = "http://127.0.0.1:3103";
  const admin = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Cookie: await cookie(ids.admin) },
  });
  const viewer = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Cookie: await cookie(ids.viewer) },
  });
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
    await db.subject.create({ data: { id: ids.subject, name: ids.subject } });
    await db.user.createMany({
      data: [
        {
          id: ids.admin,
          email: `${ids.admin}@example.invalid`,
          name: "Admin",
          password: "unused",
          role: "ADMIN",
        },
        {
          id: ids.viewer,
          email: `${ids.viewer}@example.invalid`,
          name: "Viewer",
          password: "unused",
          role: "STUDENT",
          groupId: ids.g1,
        },
      ],
    });
    const base = {
      semesterId: ids.semester,
      course: 3,
      title: "Global HTTP test",
      validFrom: date("2026-09-01"),
      validTo: date("2026-12-31"),
    };
    const draft = await db.scheduleImport.create({
      data: {
        ...base,
        id: ids.global,
        kind: "GLOBAL",
        lessons: {
          create: {
            subjectId: ids.subject,
            weekday: 0,
            startMinutes: 585,
            endMinutes: 675,
            audiences: { create: [{ groupId: ids.g1 }, { groupId: ids.g2 }] },
          },
        },
      },
    });
    await db.scheduleImport.create({
      data: {
        ...base,
        id: ids.student,
        kind: "STUDENT",
        status: "PUBLISHED",
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
    const query = "/api/schedule/global?course=3&from=2026-09-14&to=2026-09-20";
    expect((await (await viewer.get(query)).json()).groups).toEqual([]);
    const publish = await admin.patch(`/api/admin/schedule/${ids.global}`, {
      data: { action: "publish", version: draft.updatedAt.toISOString() },
    });
    expect(publish.ok(), await publish.text()).toBe(true);
    const published = await publish.json();
    const global = await viewer.get(query);
    expect(global.ok()).toBe(true);
    const globalBody = await global.json();
    expect(globalBody.groups.map((group: { id: string }) => group.id)).toEqual([
      ids.g1,
      ids.g2,
    ]);
    expect(globalBody.days[0].lessons).toHaveLength(1);
    expect(globalBody.days[0].lessons[0].groupIds).toEqual([ids.g1, ids.g2]);
    const personal = await viewer.get(
      "/api/schedule?from=2026-09-14&to=2026-09-14",
    );
    expect(personal.ok()).toBe(true);
    expect((await personal.json()).days[0].lessons[0].startMinutes).toBe(675);

    const overlap = await db.scheduleImport.create({
      data: {
        ...base,
        id: ids.overlap,
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
    const rejected = await admin.patch(`/api/admin/schedule/${ids.overlap}`, {
      data: { action: "publish", version: overlap.updatedAt.toISOString() },
    });
    expect(rejected.status()).toBe(409);
    const unpublish = await admin.patch(`/api/admin/schedule/${ids.global}`, {
      data: { action: "unpublish", version: published.version },
    });
    expect(unpublish.ok(), await unpublish.text()).toBe(true);
    expect((await (await viewer.get(query)).json()).groups).toEqual([]);
  } finally {
    await db.scheduleImport.deleteMany({
      where: { id: { in: [ids.global, ids.student, ids.overlap] } },
    });
    await db.user.deleteMany({
      where: { id: { in: [ids.admin, ids.viewer] } },
    });
    await db.subject.deleteMany({ where: { id: ids.subject } });
    await db.studyGroup.deleteMany({ where: { id: { in: [ids.g1, ids.g2] } } });
    await db.semester.deleteMany({ where: { id: ids.semester } });
    await db.academicYear.deleteMany({ where: { id: ids.year } });
    await db.$disconnect();
    await admin.dispose();
    await viewer.dispose();
  }
});
