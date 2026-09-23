import type { PrismaClient, Prisma } from "../generated/prisma/client";
import { SUBJECT_LIMITS, isValidEctsCredits } from "../subject-catalog";
import type { SubjectSchedule } from "../subject-catalog";

type Dependencies = {
  authenticate: () => Promise<{ user?: { id?: string } } | null>;
  db: Pick<PrismaClient, "user" | "subject">;
};
const select = {
  id: true,
  name: true,
  code: true,
  faculty: true,
  ectsCredits: true,
  status: true,
} as const;
const listSelect = {
  ...select,
  lessons: {
    distinct: ["scheduleId"],
    select: { schedule: { select: { id: true, status: true } } },
  },
} satisfies Prisma.SubjectSelect;
function serializeSubject(
  record: Prisma.SubjectGetPayload<{ select: typeof listSelect }>,
) {
  const { lessons, ectsCredits, ...subject } = record;
  const schedules = new Map(
    lessons.map((lesson) => [lesson.schedule.id, lesson.schedule.status]),
  );
  const published = [...schedules.values()].filter(
    (status) => status === "PUBLISHED",
  ).length;
  return {
    ...subject,
    ectsCredits: ectsCredits == null ? null : Number(ectsCredits),
    schedules: {
      total: schedules.size,
      published,
      drafts: schedules.size - published,
    },
  };
}
const detailSelect = {
  ...select,
  lessons: {
    select: {
      teacher: true,
      audiences: { select: { group: { select: { name: true } } } },
      schedule: {
        select: {
          id: true,
          title: true,
          kind: true,
          status: true,
          course: true,
          validFrom: true,
          validTo: true,
          semester: {
            select: { number: true, academicYear: { select: { name: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.SubjectSelect;
function serializeDetails(
  record: Prisma.SubjectGetPayload<{ select: typeof detailSelect }>,
) {
  const schedules = new Map<string, SubjectSchedule>();
  for (const lesson of record.lessons) {
    const source = lesson.schedule;
    let entry = schedules.get(source.id);
    if (!entry) {
      entry = {
        id: source.id,
        title: source.title,
        kind: source.kind,
        status: source.status,
        academicYear: source.semester.academicYear.name,
        semester: source.semester.number,
        course: source.course,
        validFrom: source.validFrom.toISOString().slice(0, 10),
        validTo: source.validTo.toISOString().slice(0, 10),
        lessonCount: 0,
        groups: [],
        teachers: [],
      };
      schedules.set(source.id, entry);
    }
    entry.lessonCount++;
    for (const audience of lesson.audiences)
      entry.groups.push(audience.group.name);
    if (lesson.teacher?.trim()) entry.teachers.push(lesson.teacher.trim());
  }
  const relatedSchedules = [...schedules.values()]
    .map((schedule) => ({
      ...schedule,
      groups: [...new Set(schedule.groups)].sort((a, b) =>
        a.localeCompare(b, "ru", { numeric: true }),
      ),
      teachers: [...new Set(schedule.teachers)].sort((a, b) =>
        a.localeCompare(b, "ru"),
      ),
    }))
    .sort(
      (a, b) =>
        b.validFrom.localeCompare(a.validFrom) ||
        a.title.localeCompare(b.title, "ru") ||
        a.id.localeCompare(b.id),
    );
  return { ...serializeSubject(record), relatedSchedules };
}
class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}
function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}
async function parseBody(request: Request, creating: boolean) {
  const text = await request.text();
  if (text.length > 16000)
    throw new RequestError(413, "Слишком большой запрос.");
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    throw new RequestError(400, "Неверный формат JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new RequestError(400, "Ожидается объект с полями дисциплины.");
  const allowed = creating
    ? ["name", "code", "faculty", "ectsCredits"]
    : ["name", "code", "faculty", "ectsCredits", "status"];
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    throw new RequestError(400, "Запрос содержит неизвестные поля.");
  const data: {
    name?: string;
    code?: string | null;
    faculty?: string | null;
    ectsCredits?: number | null;
    status?: "ACTIVE" | "ARCHIVED";
  } = {};
  for (const field of ["name", "code", "faculty"] as const) {
    if (!(field in body)) {
      if (creating && field === "name")
        throw new RequestError(400, "Укажите название.", field);
      continue;
    }
    const raw = body[field];
    if (raw === null && field !== "name") {
      data[field] = null;
      continue;
    }
    if (typeof raw !== "string")
      throw new RequestError(400, "Поле должно быть строкой.", field);
    const value = field === "name" ? raw.trim() : raw.trim().toUpperCase();
    if (field === "name" && !value)
      throw new RequestError(400, "Укажите название.", field);
    if (value.length > SUBJECT_LIMITS[field])
      throw new RequestError(
        400,
        `Не более ${SUBJECT_LIMITS[field]} символов.`,
        field,
      );
    if (field === "name") data.name = value;
    else data[field] = value || null;
  }
  if ("ectsCredits" in body) {
    if (body.ectsCredits !== null && !isValidEctsCredits(body.ectsCredits))
      throw new RequestError(
        400,
        "Укажите число от 0,1 до 60 с одним знаком после запятой или оставьте поле пустым.",
        "ectsCredits",
      );
    data.ectsCredits = body.ectsCredits;
  }
  if ("status" in body) {
    if (body.status !== "ACTIVE" && body.status !== "ARCHIVED")
      throw new RequestError(400, "Некорректный статус.", "status");
    data.status = body.status;
  }
  if (!Object.keys(data).length)
    throw new RequestError(400, "Нет данных для обновления.");
  return data;
}

export function createSubjectCatalogApi({ authenticate, db }: Dependencies) {
  async function run(request: Request, action: () => Promise<Response>) {
    try {
      const session = await authenticate();
      if (!session?.user?.id) throw new RequestError(401, "Войдите в аккаунт.");
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role !== "ADMIN")
        throw new RequestError(403, "Доступ только для администратора.");
      const origin = request.headers.get("origin");
      if (
        request.method !== "GET" &&
        origin &&
        origin !== new URL(request.url).origin
      )
        throw new RequestError(403, "Недопустимый источник запроса.");
      return await action();
    } catch (error) {
      if (error instanceof RequestError)
        return json(
          { message: error.message, field: error.field },
          error.status,
        );
      const code =
        error && typeof error === "object" && "code" in error
          ? error.code
          : undefined;
      if (code === "P2025")
        return json(
          { message: "Дисциплина не найдена. Обновите список." },
          404,
        );
      if (code === "P2002")
        return json(
          { message: "Дисциплина с таким названием или кодом уже существует." },
          409,
        );
      console.error("[subject-catalog] Request failed", error);
      return json(
        { message: "Не удалось выполнить действие. Попробуйте ещё раз." },
        500,
      );
    }
  }
  async function checkDuplicates(
    data: { name?: string; code?: string | null },
    id?: string,
  ) {
    const matches: Prisma.SubjectWhereInput[] = [];
    if (data.name)
      matches.push({ name: { equals: data.name, mode: "insensitive" } });
    if (data.code)
      matches.push({ code: { equals: data.code, mode: "insensitive" } });
    if (!matches.length) return;
    const existing = await db.subject.findFirst({
      where: { ...(id ? { id: { not: id } } : {}), OR: matches },
      select: { name: true, code: true },
    });
    if (existing) {
      const field =
        data.code && existing.code?.toLowerCase() === data.code.toLowerCase()
          ? "code"
          : "name";
      throw new RequestError(
        409,
        field === "code"
          ? "Дисциплина с таким кодом уже существует."
          : "Дисциплина с таким названием уже существует.",
        field,
      );
    }
  }
  return {
    GET: (request: Request) =>
      run(request, async () =>
        json(
          (
            await db.subject.findMany({
              orderBy: [{ name: "asc" }, { id: "asc" }],
              select: listSelect,
            })
          ).map(serializeSubject),
        ),
      ),
    DETAIL: (request: Request, id: string) =>
      run(request, async () => {
        const record = await db.subject.findUnique({
          where: { id },
          select: detailSelect,
        });
        if (!record)
          throw new RequestError(
            404,
            "Дисциплина не найдена. Обновите список.",
          );
        return json(serializeDetails(record));
      }),
    POST: (request: Request) =>
      run(request, async () => {
        const data = await parseBody(request, true);
        await checkDuplicates(data);
        return json(
          serializeSubject(
            await db.subject.create({
              data: { ...data, name: data.name! },
              select: listSelect,
            }),
          ),
          201,
        );
      }),
    PATCH: (request: Request, id: string) =>
      run(request, async () => {
        const data = await parseBody(request, false);
        if (
          !(await db.subject.findUnique({
            where: { id },
            select: { id: true },
          }))
        )
          throw new RequestError(
            404,
            "Дисциплина не найдена. Обновите список.",
          );
        await checkDuplicates(data, id);
        return json(
          serializeSubject(
            await db.subject.update({
              where: { id },
              data,
              select: listSelect,
            }),
          ),
        );
      }),
  };
}
