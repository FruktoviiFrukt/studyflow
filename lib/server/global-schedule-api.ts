import type { PrismaClient } from "../generated/prisma/client";
import { calculateGlobalSchedule } from "./global-schedule.ts";
import {
  ScheduleConflictError,
  validateScheduleRange,
} from "./schedule-calculation.ts";

type Dependencies = {
  authenticate: () => Promise<{ user?: { id?: string } } | null>;
  db: Pick<PrismaClient, "user" | "scheduleImport">;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}

// Injected dependencies keep the same handler usable by the route and tests.
export function createGlobalScheduleGet({ authenticate, db }: Dependencies) {
  return async function getGlobalSchedule(request: Request): Promise<Response> {
    try {
      const session = await authenticate();
      const userId = session?.user?.id;
      if (!userId)
        return json(
          { code: "UNAUTHORIZED", message: "Войдите в аккаунт." },
          401,
        );

      const params = new URL(request.url).searchParams;
      if (
        [...params.keys()].some(
          (key) => key !== "course" && key !== "from" && key !== "to",
        ) ||
        params.getAll("course").length !== 1 ||
        params.getAll("from").length !== 1 ||
        params.getAll("to").length !== 1
      )
        return json(
          {
            code: "INVALID_QUERY",
            message: "Передайте course, from и to по одному разу.",
          },
          400,
        );

      const courseValue = params.get("course")!;
      const from = params.get("from")!;
      const to = params.get("to")!;
      const course = Number(courseValue);
      if (!/^(?:[1-9]|10)$/.test(courseValue) || !Number.isInteger(course))
        return json(
          {
            code: "INVALID_QUERY",
            message: "Курс должен быть целым числом от 1 до 10.",
          },
          400,
        );
      try {
        validateScheduleRange(from, to, 7);
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        return json({ code: "INVALID_QUERY", message: error.message }, 400);
      }

      // The session identifies the user; existence is checked in the database.
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user)
        return json(
          {
            code: "UNAUTHORIZED",
            message: "Аккаунт не найден. Войдите заново.",
          },
          401,
        );

      const left = new Date(`${from}T00:00:00Z`);
      const right = new Date(`${to}T00:00:00Z`);
      const schedules = await db.scheduleImport.findMany({
        where: {
          status: "PUBLISHED",
          kind: "GLOBAL",
          course,
          validFrom: { lte: right },
          validTo: { gte: left },
          semester: {
            startsOn: { lte: right },
            endsOn: { gte: left },
            academicYear: { startsOn: { lte: right }, endsOn: { gte: left } },
          },
          lessons: { some: { audiences: { some: {} } } },
        },
        include: {
          semester: { include: { academicYear: true } },
          holidays: {
            where: { startsOn: { lte: right }, endsOn: { gte: left } },
          },
          // All weekdays and audiences establish which groups belong to each
          // publication, even if a particular day has no lessons.
          lessons: {
            include: {
              subject: true,
              audiences: {
                include: { group: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      });
      const groups = new Map<string, { id: string; name: string }>();
      for (const schedule of schedules)
        for (const lesson of schedule.lessons)
          for (const audience of lesson.audiences)
            groups.set(audience.group.id, audience.group);

      const result = calculateGlobalSchedule({
        course,
        from,
        to,
        groups: [...groups.values()],
        schedules,
      });
      return json({ course, from, to, timeZone: "Europe/Chisinau", ...result });
    } catch (error) {
      if (error instanceof ScheduleConflictError)
        return json(
          {
            code: "SCHEDULE_CONFLICT",
            message:
              "Найдены пересекающиеся опубликованные расписания. Обратитесь к администратору.",
          },
          409,
        );
      console.error("[global-schedule] Не удалось загрузить расписание.");
      return json(
        {
          code: "INTERNAL_ERROR",
          message: "Не удалось загрузить расписание. Попробуйте позже.",
        },
        500,
      );
    }
  };
}
