import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";

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
    expect(
      (
        await admin.patch(`/api/admin/schedule/${id}`, {
          data: { action: "publish", version: record.version },
        })
      ).status(),
    ).toBe(400);
    const shared = record.lessons.find(
      (l: { audiences: unknown[]; subject: string }) =>
        l.audiences.length > 1 && l.subject.includes("Analiza"),
    );
    expect(shared).toBeTruthy();
    const lesson = {
      ...shared,
      id: "",
      subject: "Проверенная лекция",
      day: 0,
      start: "18:45",
      end: "20:15",
      parity: "every",
      reviewed: true,
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
      include: { subgroups: true },
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
      data: { groupId: group.id, subgroupId: group.subgroups[0].id },
    });
    const holiday = await student.get(
      "/api/schedule?from=2026-09-14&to=2026-09-14",
    );
    expect((await holiday.json()).days[0].status).toBe("HOLIDAY");
    const lessons = await student.get(
      "/api/schedule?from=2026-09-21&to=2026-09-21",
    );
    expect((await lessons.json()).days[0].lessons[0].subject.name).toBe(
      "Проверенная лекция",
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
