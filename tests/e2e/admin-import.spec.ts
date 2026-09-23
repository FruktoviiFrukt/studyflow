import { test, expect, type APIRequestContext } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { randomUUID } from "node:crypto";
import type { SubjectMatchPreview } from "../../lib/subject-matching";

async function confirmedImport(
  admin: APIRequestContext,
  options: NonNullable<Parameters<APIRequestContext["post"]>[1]>,
) {
  const preview = await admin.post("/api/admin/schedule", {
    ...options,
    multipart: { ...options.multipart, stage: "preview" },
  });
  expect(preview.ok(), await preview.text()).toBe(true);
  const matches: SubjectMatchPreview = await preview.json();
  return admin.post("/api/admin/schedule", {
    ...options,
    multipart: {
      ...options.multipart,
      stage: "confirm",
      subjectChoices: JSON.stringify(
        matches.subjects.map((s) => ({
          sourceName: s.sourceName,
          subjectId: s.exactIds[0] ?? null,
        })),
      ),
    },
  });
}

test("subject matching previews without writes and preserves mapping and PDF names across edits and repeat imports", async ({
  playwright,
}) => {
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.IMPORT_TEST_DATABASE_URL,
    }),
  });
  const adminId = "matching-" + randomUUID();
  const token = await encode({
    secret: "import-test-secret-only",
    salt: "authjs.session-token",
    token: { id: adminId, sub: adminId },
  });
  const admin = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3103",
    extraHTTPHeaders: { Cookie: `authjs.session-token=${token}` },
  });
  const ids: string[] = [];
  let canonicalId = "";
  try {
    await db.user.create({
      data: {
        id: adminId,
        email: `${adminId}@example.invalid`,
        name: "Test",
        password: "unused",
        role: "ADMIN",
      },
    });
    const canonical = await db.subject.create({
      data: {
        name: adminId + " canonical",
        status: "ARCHIVED",
        ectsCredits: 4.5,
      },
    });
    canonicalId = canonical.id;
    const multipart = {
      kind: "STUDENT",
      year: "2026/2027",
      course: "1",
      semester: "1",
      from: "2026-09-01",
      to: "2026-12-31",
      first: "2026-08-31",
      file: {
        name: "matching.pdf",
        mimeType: "application/pdf",
        buffer: await readFile(process.env.IMPORT_TEST_PDF!),
      },
    };
    const before = [
      await db.subject.count(),
      await db.scheduleImport.count(),
      await db.lesson.count(),
    ];
    const preview = await admin.post("/api/admin/schedule", {
      multipart: { ...multipart, stage: "preview" },
    });
    expect(preview.ok(), await preview.text()).toBe(true);
    const matches: SubjectMatchPreview = await preview.json();
    expect(matches.subjects.length).toBeGreaterThan(0);
    expect([
      await db.subject.count(),
      await db.scheduleImport.count(),
      await db.lesson.count(),
    ]).toEqual(before);
    const choices = matches.subjects.map((s, i) => ({
      sourceName: s.sourceName,
      subjectId: i === 0 ? canonical.id : (s.exactIds[0] ?? null),
    }));
    const invalid = await admin.post("/api/admin/schedule", {
      multipart: { ...multipart, stage: "confirm", subjectChoices: "[]" },
    });
    expect(invalid.status()).toBe(400);
    expect([
      await db.subject.count(),
      await db.scheduleImport.count(),
      await db.lesson.count(),
    ]).toEqual(before);
    const confirm = () =>
      admin.post("/api/admin/schedule", {
        multipart: {
          ...multipart,
          stage: "confirm",
          subjectChoices: JSON.stringify(choices),
        },
      });
    const response = await confirm();
    expect(response.ok(), await response.text()).toBe(true);
    const record = await response.json();
    ids.push(record.id);
    const mapped = record.lessons.filter(
      (l: { sourceSubjectName: string }) =>
        l.sourceSubjectName === choices[0].sourceName,
    );
    expect(mapped.length).toBeGreaterThan(0);
    expect(
      mapped.every(
        (l: { subjectId: string; subject: string }) =>
          l.subjectId === canonical.id && l.subject === canonical.name,
      ),
    ).toBe(true);
    expect(
      record.lessons.every(
        (l: { sourceSubjectName: string }) => !!l.sourceSubjectName,
      ),
    ).toBe(true);
    const count = await db.subject.count();
    const repeated = await confirm();
    expect(repeated.ok(), await repeated.text()).toBe(true);
    ids.push((await repeated.json()).id);
    expect(await db.subject.count()).toBe(count);
    await db.subject.update({
      where: { id: canonical.id },
      data: { name: canonical.name + " renamed" },
    });
    const saved = await admin.patch(`/api/admin/schedule/${record.id}`, {
      data: {
        action: "save",
        version: record.version,
        lessons: record.lessons.map((l: object) => ({
          ...l,
          sourceSubjectName: "tampered",
        })),
        holidays: [],
      },
    });
    expect(saved.ok(), await saved.text()).toBe(true);
    const updated = await saved.json();
    expect(
      updated.lessons
        .filter((l: { subjectId: string }) => l.subjectId === canonical.id)
        .every(
          (l: { sourceSubjectName: string; subject: string }) =>
            l.sourceSubjectName === choices[0].sourceName &&
            l.subject === canonical.name + " renamed",
        ),
    ).toBe(true);
    const stored = await db.subject.findUniqueOrThrow({
      where: { id: canonical.id },
    });
    expect(stored.status).toBe("ARCHIVED");
    expect(Number(stored.ectsCredits)).toBe(4.5);
  } finally {
    for (const id of ids) {
      const record = await db.scheduleImport.findUnique({ where: { id } });
      if (record)
        await admin.patch(`/api/admin/schedule/${id}`, {
          data: { action: "delete", version: record.updatedAt.toISOString() },
        });
    }
    if (canonicalId) await db.subject.delete({ where: { id: canonicalId } });
    await db.user.deleteMany({ where: { id: adminId } });
    await db.$disconnect();
    await admin.dispose();
  }
});

test("matching UI requires ambiguous decisions and keeps choices after a failed confirmation", async ({
  page,
}) => {
  test.setTimeout(45000);
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.IMPORT_TEST_DATABASE_URL,
    }),
  });
  const adminId = "matching-ui-" + randomUUID();
  await db.user.create({
    data: {
      id: adminId,
      email: `${adminId}@example.invalid`,
      name: "Test",
      password: "unused",
      role: "ADMIN",
    },
  });
  const token = await encode({
    secret: "import-test-secret-only",
    salt: "authjs.session-token",
    token: { id: adminId, sub: adminId, role: "ADMIN" },
  });
  await page.context().addCookies([
    {
      name: "authjs.session-token",
      value: token,
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  try {
    let confirmed = 0;
    await page.route("**/api/admin/schedule", async (route) => {
      if (route.request().method() === "GET")
        return route.fulfill({ json: [] });
      const body = route.request().postData() || "";
      if (body.includes('"confirm"') || body.includes("\r\nconfirm\r\n")) {
        confirmed++;
        return route.fulfill({
          status: 400,
          json: { message: "Повторите подтверждение" },
        });
      }
      return route.fulfill({
        json: {
          lessonCount: 3,
          catalog: [
            { id: "a", name: "Algebra", code: "ALG", status: "ARCHIVED" },
            { id: "b", name: "Algebra liniară", code: null, status: "ACTIVE" },
          ],
          subjects: [
            { sourceName: "ALGEBRA", exactIds: ["a"], suggestedIds: ["b"] },
            { sourceName: "Algebra lin", exactIds: [], suggestedIds: ["b"] },
            { sourceName: "Новый предмет", exactIds: [], suggestedIds: [] },
          ],
        },
      });
    });
    await page.goto("/admin/schedule");
    await page
      .getByRole("button", { name: "Новое расписание", exact: true })
      .click();
    await page.getByLabel("PDF расписания", { exact: true }).setInputFiles({
      name: "test.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-test"),
    });
    await page
      .getByRole("button", { name: "Загрузить и распознать", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Сопоставить дисциплины" }),
    ).toBeVisible();
    const confirm = page.getByRole("button", {
      name: "Подтвердить и создать черновик",
      exact: true,
    });
    await expect(confirm).toBeDisabled();
    await expect(page.locator("#subject-match-0")).toHaveValue("a");
    await expect(page.locator("#subject-match-2")).toHaveValue("new");
    await page.locator("#subject-match-1").selectOption("b");
    await confirm.click();
    await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
      "Повторите подтверждение",
    );
    await expect(page.locator("#subject-match-1")).toHaveValue("b");
    expect(confirmed).toBe(1);
    await page.screenshot({
      path: ".review-output/subject-matching-desktop.png",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: ".review-output/subject-matching-mobile.png",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Назад к файлу", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Загрузить расписание" }),
    ).toBeVisible();
  } finally {
    await db.user.delete({ where: { id: adminId } });
    await db.$disconnect();
  }
});

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
    const upload = await confirmedImport(admin, {
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
      subjectId: undefined,
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
      page.getByText("Лекция из PDF", { exact: true }),
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

test("one PDF creates both schedule drafts and remains available until both are deleted", async ({
  playwright,
}) => {
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.IMPORT_TEST_DATABASE_URL,
    }),
  });
  const adminId = `paired-import-${randomUUID()}`;
  const token = await encode({
    secret: "import-test-secret-only",
    salt: "authjs.session-token",
    token: { id: adminId, sub: adminId, role: "ADMIN" },
  });
  const admin = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3103",
    extraHTTPHeaders: { Cookie: `authjs.session-token=${token}` },
  });
  const ids: string[] = [];
  try {
    await db.user.create({
      data: {
        id: adminId,
        role: "ADMIN",
        email: `${adminId}@example.invalid`,
        name: adminId,
        password: "test-unused",
      },
    });
    const upload = await confirmedImport(admin, {
      multipart: {
        kind: "GLOBAL",
        createOther: "true",
        year: "2028/2029",
        course: "1",
        semester: "1",
        from: "2028-09-01",
        to: "2028-12-20",
        first: "2028-08-28",
        file: {
          name: "paired.pdf",
          mimeType: "application/pdf",
          buffer: await readFile(process.env.IMPORT_TEST_PDF!),
        },
      },
      timeout: 180000,
    });
    expect(upload.ok(), await upload.text()).toBe(true);
    const primary = await upload.json();
    ids.push(primary.id);
    expect(primary.kind).toBe("GLOBAL");
    expect(primary.validFrom).toBe("2028-09-01");
    expect(primary.validTo).toBe("2028-12-20");
    const source = await db.scheduleImport.findUniqueOrThrow({
      where: { id: primary.id },
    });
    const pair = await db.scheduleImport.findFirstOrThrow({
      where: { sourceFileKey: source.sourceFileKey, id: { not: primary.id } },
      include: { lessons: true },
    });
    ids.push(pair.id);
    expect(pair.kind).toBe("STUDENT");
    expect(pair.lessons).toHaveLength(primary.lessons.length);
    expect(pair.validFrom).toEqual(source.validFrom);
    expect(pair.validTo).toEqual(source.validTo);

    const deleted = await admin.patch(`/api/admin/schedule/${primary.id}`, {
      data: { action: "delete", version: primary.version },
    });
    expect(deleted.ok(), await deleted.text()).toBe(true);
    ids.shift();
    expect(
      (await admin.get(`/api/admin/schedule/${pair.id}/source`)).ok(),
    ).toBe(true);

    const remaining = await admin.get("/api/admin/schedule");
    const records = await remaining.json();
    const paired = records.find(
      (record: { id: string }) => record.id === pair.id,
    );
    const lastDeleted = await admin.patch(`/api/admin/schedule/${pair.id}`, {
      data: { action: "delete", version: paired.version },
    });
    expect(lastDeleted.ok(), await lastDeleted.text()).toBe(true);
    ids.shift();
  } finally {
    if (ids.length)
      await db.scheduleImport.deleteMany({ where: { id: { in: ids } } });
    await db.user.deleteMany({ where: { id: adminId } });
    await db.$disconnect();
    await admin.dispose();
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

test("assessment PDF import produces dated lessons readable via the student assessment API", async ({
  playwright,
}) => {
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.IMPORT_TEST_DATABASE_URL,
    }),
  });
  const prefix = `assessment-import-${randomUUID()}`;
  const adminId = `${prefix}-admin`;
  const studentId = `${prefix}-student`;
  async function cookie(userId: string, role: "ADMIN" | "STUDENT") {
    const token = await encode({
      secret: "import-test-secret-only",
      salt: "authjs.session-token",
      token: { id: userId, sub: userId, role },
    });
    return `authjs.session-token=${token}`;
  }
  const baseURL = "http://127.0.0.1:3103";
  const admin = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Cookie: await cookie(adminId, "ADMIN") },
  });
  const student = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Cookie: await cookie(studentId, "STUDENT") },
  });
  let id: string | undefined;
  try {
    await db.user.create({
      data: {
        id: adminId,
        role: "ADMIN",
        email: `${adminId}@example.invalid`,
        name: adminId,
        password: "test-unused",
      },
    });
    await db.user.create({
      data: {
        id: studentId,
        role: "STUDENT",
        email: `${studentId}@example.invalid`,
        name: studentId,
        password: "test-unused",
      },
    });
    const upload = await confirmedImport(admin, {
      multipart: {
        kind: "ASSESSMENT",
        year: "2024/2025",
        course: "2",
        semester: "1",
        from: "2024-09-01",
        to: "2024-12-20",
        first: "2024-08-26",
        file: {
          name: "assessment.pdf",
          mimeType: "application/pdf",
          buffer: await readFile(process.env.IMPORT_TEST_ASSESSMENT_PDF!),
        },
      },
      timeout: 180000,
    });
    expect(upload.ok(), await upload.text()).toBe(true);
    const record = await upload.json();
    expect(record.kind).toBe("ASSESSMENT");
    id = record.id;
    expect(record.lessons.length).toBeGreaterThan(30);
    const lesson = record.lessons.find(
      (l: { subject: string; teacher: string }) =>
        l.subject === "Analiza matematica 1" && l.teacher === "Pricop V.",
    );
    expect(lesson).toBeTruthy();
    expect(lesson.date).toBe("2024-10-24");
    expect(lesson.start).toBe("09:45");
    expect(lesson.room).toBe("3-3");
    expect(lesson.audiences.map((a: { group: string }) => a.group)).toContain(
      "CIM-241",
    );
    // The parser must widen parse_pdf.py's group pattern to keep compound
    // codes like "SD-IA-241" whole instead of truncating to "IA-241".
    const compound = record.lessons.find(
      (l: { audiences: { group: string }[] }) =>
        l.audiences.some((a) => a.group === "SD-IA-241"),
    );
    expect(compound).toBeTruthy();

    const group = await db.studyGroup.findUniqueOrThrow({
      where: { name: "CIM-241" },
    });
    await db.user.update({
      where: { id: studentId },
      data: { groupId: group.id, subgroupId: null },
    });
    const reviewedLessons = record.lessons.map(
      (l: Record<string, unknown>) => ({
        ...l,
        reviewed: true,
      }),
    );
    const saved = await admin.patch(`/api/admin/schedule/${id}`, {
      data: {
        action: "save",
        version: record.version,
        lessons: reviewedLessons,
        holidays: [],
      },
    });
    expect(saved.ok(), await saved.text()).toBe(true);
    const withReviewed = await saved.json();
    const published = await admin.patch(`/api/admin/schedule/${id}`, {
      data: { action: "publish", version: withReviewed.version },
    });
    expect(published.ok(), await published.text()).toBe(true);

    const view = await student.get(
      "/api/schedule/assessments?from=2024-10-21&to=2024-10-25",
    );
    expect(view.ok(), await view.text()).toBe(true);
    const body = await view.json();
    expect(body.status).toBe("READY");
    const thursday = body.days.find(
      (d: { date: string }) => d.date === "2024-10-24",
    );
    expect(thursday.status).toBe("LESSONS");
    expect(thursday.lessons[0].subject.name).toBe("Analiza matematica 1");
    expect(thursday.lessons[0].teacher).toBe("Pricop V.");
    expect(thursday.lessons[0].startMinutes).toBe(9 * 60 + 45);
  } finally {
    if (id) await db.scheduleImport.deleteMany({ where: { id } });
    await db.user.deleteMany({ where: { id: { in: [adminId, studentId] } } });
    await db.$disconnect();
    await admin.dispose();
    await student.dispose();
  }
});
