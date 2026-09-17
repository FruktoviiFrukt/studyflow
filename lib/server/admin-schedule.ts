import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  lessonErrors,
  SCHEDULE_KIND_LABELS,
  type AdminLesson,
  type ScheduleHoliday,
} from "@/lib/admin-schedule";
import { validateScheduleRange, academicWeek } from "./student-schedule";

const execute = promisify(execFile);
const root = path.resolve(
  process.env.SCHEDULE_UPLOAD_DIR || ".data/schedule-pdfs",
);
const include = {
  semester: { include: { academicYear: true } },
  holidays: true,
  lessons: {
    include: {
      subject: true,
      audiences: { include: { group: true, subgroup: true } },
    },
  },
} satisfies Prisma.ScheduleImportInclude;
type RecordWithRelations = Prisma.ScheduleImportGetPayload<{
  include: typeof include;
}>;
const types = {
  Лекция: "LECTURE",
  Лабораторная: "LABORATORY",
  Семинар: "SEMINAR",
} as const;
const typeLabels = {
  LECTURE: "Лекция",
  LABORATORY: "Лабораторная",
  SEMINAR: "Семинар",
  PRACTICE: "Семинар",
  UNSPECIFIED: "Семинар",
} as const;
const parities = { every: "EVERY", odd: "ODD", even: "EVEN" } as const;
const date = (d: string) => new Date(`${d}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const time = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function fail(message: string): never {
  throw new HttpError(400, message);
}
export function serializeSchedule(r: RecordWithRelations) {
  return {
    id: r.id,
    kind: r.kind,
    version: r.updatedAt.toISOString(),
    year: r.semester.academicYear.name,
    course: String(r.course),
    semester: String(r.semester.number),
    filename: r.title,
    validFrom: iso(r.validFrom),
    validTo: iso(r.validTo),
    status: r.status === "DRAFT" ? "draft" : "published",
    sourceUrl: r.sourceFileKey
      ? `/api/admin/schedule/${r.id}/source`
      : undefined,
    warnings: r.importWarnings,
    lessons: r.lessons.map((l) => ({
      id: l.id,
      subject: l.subject.name,
      day: l.weekday,
      start: time(l.startMinutes),
      end: time(l.endMinutes),
      type: typeLabels[l.type],
      parity: Object.entries(parities).find(
        ([, value]) => value === l.weekPattern,
      )![0],
      teacher: l.teacher || "",
      room: l.classroom || "",
      topic: l.topic || "",
      sourceText: l.sourceText || "",
      reviewed: l.reviewed,
      audiences: [...new Set(l.audiences.map((a) => a.group.name))].map(
        (group) => ({ group, subgroup: "all" as const }),
      ),
    })),
    holidays: r.holidays.map((h) => ({
      id: h.id,
      name: h.name,
      start: iso(h.startsOn),
      end: iso(h.endsOn),
    })),
  };
}

export async function adminRequest(
  request: Request,
  run: () => Promise<unknown>,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new HttpError(401, "Войдите в аккаунт.");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role !== "ADMIN")
      throw new HttpError(403, "Доступ только для администратора.");
    if (
      request.method !== "GET" &&
      request.headers.get("origin") &&
      request.headers.get("origin") !== new URL(request.url).origin
    )
      throw new HttpError(403, "Недопустимый источник запроса.");
    const body = await run();
    if (body instanceof Response) return body;
    return Response.json(body, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status =
      error instanceof HttpError
        ? error.status
        : error instanceof RangeError || error instanceof SyntaxError
          ? 400
          : 500;
    return Response.json(
      {
        message:
          status === 500
            ? "Не удалось выполнить действие. Проверьте БД и настройки импорта на сервере."
            : (error as Error).message,
      },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

export async function listSchedules() {
  return (
    await prisma.scheduleImport.findMany({
      include,
      orderBy: { updatedAt: "desc" },
    })
  ).map(serializeSchedule);
}

function validateLessons(value: unknown): AdminLesson[] {
  if (!Array.isArray(value) || value.length > 2000)
    fail("Допустимо не более 2000 занятий.");
  for (const l of value) {
    if (
      !l ||
      ![
        "subject",
        "start",
        "end",
        "type",
        "parity",
        "teacher",
        "room",
        "topic",
      ].every((key) => typeof l[key] === "string" && l[key].length <= 1000) ||
      typeof l.reviewed !== "boolean" ||
      !Object.hasOwn(types, l.type) ||
      !Object.hasOwn(parities, l.parity) ||
      !Array.isArray(l.audiences) ||
      l.audiences.length > 100 ||
      l.audiences.some(
        (a: { group: string; subgroup: string }) =>
          !a ||
          typeof a.group !== "string" ||
          !/^[A-ZА-Я0-9-]{2,30}$/u.test(a.group) ||
          !["all", "1", "2"].includes(a.subgroup),
      )
    )
      fail("Некорректные поля занятия или получатели.");
    if (
      l.sourceText !== undefined &&
      (typeof l.sourceText !== "string" || l.sourceText.length > 10000)
    )
      fail("Слишком длинный исходный текст.");
    l.audiences = [
      ...new Set(l.audiences.map((a: { group: string }) => a.group)),
    ].map((group) => ({ group, subgroup: "all" }));
    const errors = lessonErrors(l);
    if (errors.length) fail(errors.join(" "));
  }
  return value;
}

async function saveLessons(
  tx: Prisma.TransactionClient,
  scheduleId: string,
  lessons: AdminLesson[],
) {
  const groups = new Map<string, { id: string }>();
  for (const name of new Set(
    lessons.flatMap((l) => l.audiences.map((a) => a.group)),
  )) {
    const group = await tx.studyGroup.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    groups.set(name, group);
  }
  await tx.lesson.deleteMany({ where: { scheduleId } });
  for (const l of lessons) {
    const subject = await tx.subject.upsert({
      where: { name: l.subject.trim() },
      update: {},
      create: { name: l.subject.trim() },
    });
    await tx.lesson.create({
      data: {
        scheduleId,
        subjectId: subject.id,
        weekday: l.day,
        startMinutes: minutes(l.start),
        endMinutes: minutes(l.end),
        type: types[l.type as keyof typeof types],
        weekPattern: parities[l.parity],
        teacher: l.teacher || null,
        classroom: l.room || null,
        topic: l.topic || null,
        sourceText: l.sourceText || null,
        reviewed: l.reviewed,
        audiences: {
          create: l.audiences.map((a) => {
            const group = groups.get(a.group)!;
            return {
              groupId: group.id,
              subgroupId: null,
            };
          }),
        },
      },
    });
  }
}

export async function importSchedule(request: Request) {
  if (Number(request.headers.get("content-length")) > 22 * 1024 * 1024)
    throw new HttpError(413, "PDF должен быть не больше 20 МБ.");
  const form = await request.formData();
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    !file.size ||
    file.size > 20 * 1024 * 1024 ||
    !file.name.toLowerCase().endsWith(".pdf")
  )
    fail("Выберите PDF до 20 МБ.");
  const year = String(form.get("year") || "");
  const kind = form.get("kind") ?? "STUDENT";
  if (typeof kind !== "string" || !Object.hasOwn(SCHEDULE_KIND_LABELS, kind))
    fail("Выберите тип расписания.");
  const from = String(form.get("from") || ""),
    to = String(form.get("to") || ""),
    first = String(form.get("first") || "");
  const course = Number(form.get("course")),
    number = Number(form.get("semester"));
  if (
    !/^\d{4}\/\d{4}$/.test(year) ||
    Number(year.slice(5)) !== Number(year.slice(0, 4)) + 1 ||
    !Number.isInteger(course) ||
    course < 1 ||
    course > 10 ||
    ![1, 2].includes(number)
  )
    fail("Проверьте год, курс и семестр.");
  validateScheduleRange(from, to);
  academicWeek(from, first);
  const yearFrom = `${year.slice(0, 4)}-09-01`,
    yearTo = `${year.slice(5)}-08-31`;
  if (
    from < yearFrom ||
    to > yearTo ||
    first > from ||
    date(first).getTime() < date(yearFrom).getTime() - 6 * 86400000
  )
    fail("Даты должны соответствовать выбранному учебному году.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString() !== "%PDF-")
    fail("Файл не похож на PDF.");
  const key = `${randomUUID()}.pdf`,
    location = path.join(root, key);
  await mkdir(root, { recursive: true });
  await writeFile(location, bytes, { flag: "wx" });
  try {
    let extracted: { lessons: AdminLesson[]; warnings: string[] };
    try {
      const { stdout } = await execute(
        process.env.SCHEDULE_PYTHON || "python",
        [
          "-X",
          "utf8",
          path.resolve("scripts/schedule-import/parse_pdf.py"),
          location,
        ],
        { timeout: 90000, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
      );
      extracted = JSON.parse(stdout);
    } catch {
      throw new HttpError(
        422,
        "PDF не удалось разобрать. Проверьте файл и установку Python/pdfplumber на сервере.",
      );
    }
    const lessons = validateLessons(extracted.lessons);
    return await prisma.$transaction(
      async (tx) => {
        const academic = await tx.academicYear.upsert({
          where: { name: year },
          update: {},
          create: {
            name: year,
            startsOn: date(yearFrom),
            endsOn: date(yearTo),
            firstOddWeekMonday: date(first),
          },
        });
        if (iso(academic.firstOddWeekMonday) !== first)
          fail("Для этого года уже задан другой понедельник отсчёта.");
        const semester = await tx.semester.upsert({
          where: {
            academicYearId_number: { academicYearId: academic.id, number },
          },
          update: {},
          create: {
            academicYearId: academic.id,
            number,
            startsOn: date(from),
            endsOn: date(to),
          },
        });
        if (from < iso(semester.startsOn) || to > iso(semester.endsOn))
          fail("Период выходит за существующие границы семестра.");
        const record = await tx.scheduleImport.create({
          data: {
            semesterId: semester.id,
            course,
            kind: kind as keyof typeof SCHEDULE_KIND_LABELS,
            title: file.name,
            sourceFilename: file.name,
            sourceFileKey: key,
            validFrom: date(from),
            validTo: date(to),
            importWarnings: extracted.warnings,
          },
        });
        await saveLessons(tx, record.id, lessons);
        return serializeSchedule(
          await tx.scheduleImport.findUniqueOrThrow({
            where: { id: record.id },
            include,
          }),
        );
      },
      { timeout: 120000 },
    );
  } catch (error) {
    await unlink(location).catch(() => {});
    throw error;
  }
}

export async function changeSchedule(request: Request, id: string) {
  const text = await request.text();
  if (text.length > 4 * 1024 * 1024)
    throw new HttpError(413, "Слишком большой запрос.");
  const body = JSON.parse(text);
  if (
    !body ||
    !["save", "publish", "unpublish", "delete"].includes(body.action) ||
    typeof body.version !== "string"
  )
    fail("Некорректное действие.");
  let removedFile: string | null = null;
  const result = await prisma.$transaction(
    async (tx) => {
      // All mutations share a DB lock: publishing cannot race with a draft edit.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(735026151)`;
      const record = await tx.scheduleImport.findUnique({
        where: { id },
        include,
      });
      if (!record) throw new HttpError(404, "Расписание не найдено.");
      if (record.updatedAt.toISOString() !== body.version)
        throw new HttpError(409, "Расписание уже изменено. Обновите список.");
      if (body.action === "unpublish") {
        await tx.scheduleImport.update({
          where: { id },
          data: { status: "DRAFT" },
        });
      } else {
        if (record.status !== "DRAFT")
          throw new HttpError(409, "Сначала верните расписание в черновик.");
        if (body.action === "delete") {
          await tx.scheduleImport.delete({ where: { id } });
          removedFile = record.sourceFileKey;
          return { deleted: true };
        }
        if (body.action === "save") {
          const lessons = validateLessons(body.lessons);
          if (!Array.isArray(body.holidays) || body.holidays.length > 100)
            fail("Некорректный список каникул.");
          for (const h of body.holidays) {
            if (
              !h ||
              typeof h.name !== "string" ||
              !h.name.trim() ||
              h.name.length > 100 ||
              typeof h.start !== "string" ||
              typeof h.end !== "string"
            )
              fail("Проверьте каникулы.");
            validateScheduleRange(h.start, h.end);
            if (h.start < iso(record.validFrom) || h.end > iso(record.validTo))
              fail("Каникулы должны находиться в периоде расписания.");
          }
          await saveLessons(tx, id, lessons);
          await tx.scheduleHoliday.deleteMany({ where: { scheduleId: id } });
          await tx.scheduleHoliday.createMany({
            data: (body.holidays as ScheduleHoliday[]).map((h) => ({
              scheduleId: id,
              name: h.name.trim(),
              startsOn: date(h.start),
              endsOn: date(h.end),
            })),
          });
          await tx.scheduleImport.update({
            where: { id },
            data: { updatedAt: new Date() },
          });
        } else if (body.action === "publish") {
          const draft = serializeSchedule(record);
          if (!draft.lessons.length)
            fail("Добавьте хотя бы одно занятие перед публикацией.");
          const groupIds = [
            ...new Set(
              record.lessons.flatMap((l) => l.audiences.map((a) => a.groupId)),
            ),
          ];
          if (!groupIds.length)
            fail("Добавьте группу хотя бы к одному занятию перед публикацией.");
          const other = await tx.scheduleImport.findFirst({
            where: {
              id: { not: id },
              status: "PUBLISHED",
              kind: record.kind,
              validFrom: { lte: record.validTo },
              validTo: { gte: record.validFrom },
              lessons: {
                some: { audiences: { some: { groupId: { in: groupIds } } } },
              },
            },
          });
          if (other)
            throw new HttpError(
              409,
              "Для этих групп и дат уже есть публикация. Сначала верните прежнее расписание в черновик.",
            );
          await tx.scheduleImport.update({
            where: { id },
            data: { status: "PUBLISHED" },
          });
        }
      }
      return serializeSchedule(
        await tx.scheduleImport.findUniqueOrThrow({ where: { id }, include }),
      );
    },
    { timeout: 120000 },
  );
  if (removedFile && /^[a-f0-9-]{36}\.pdf$/.test(removedFile))
    await unlink(path.join(root, removedFile)).catch(() => {
      console.error(
        "[schedule] Failed to remove an orphan PDF after draft deletion.",
      );
    });
  return result;
}

export async function sourcePdf(id: string) {
  const record = await prisma.scheduleImport.findUnique({
    where: { id },
    select: { sourceFileKey: true },
  });
  if (
    !record?.sourceFileKey ||
    !/^[a-f0-9-]{36}\.pdf$/.test(record.sourceFileKey)
  )
    throw new HttpError(404, "PDF не найден.");
  return new Response(await readFile(path.join(root, record.sourceFileKey)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=schedule.pdf",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
