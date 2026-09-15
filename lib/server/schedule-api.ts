import type { PrismaClient } from "../generated/prisma/client";
import {
  calculateStudentSchedule,
  ScheduleConflictError,
  validateScheduleRange,
} from "./student-schedule";

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

// The same handler is used by the route and by tests with isolated dependencies.
export function createScheduleGet({ authenticate, db }: Dependencies) {
  return async function getSchedule(request: Request): Promise<Response> {
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
        [...params.keys()].some((key) => key !== "from" && key !== "to") ||
        params.getAll("from").length !== 1 ||
        params.getAll("to").length !== 1
      ) {
        return json(
          {
            code: "INVALID_RANGE",
            message:
              "Передайте только from и to по одному разу, в формате YYYY-MM-DD.",
          },
          400,
        );
      }
      const from = params.get("from")!;
      const to = params.get("to")!;
      try {
        validateScheduleRange(from, to);
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        return json({ code: "INVALID_RANGE", message: error.message }, 400);
      }

      // JWT membership can be stale; use only its user ID, then read current DB relations.
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          groupId: true,
          studyGroup: { select: { id: true, name: true } },
          subgroup: { select: { id: true, groupId: true, number: true } },
        },
      });
      if (!user)
        return json(
          {
            code: "UNAUTHORIZED",
            message: "Аккаунт не найден. Войдите заново.",
          },
          401,
        );
      const metadata = {
        from,
        to,
        timeZone: "Europe/Chisinau",
        group: user.studyGroup,
        subgroup: user.subgroup
          ? { id: user.subgroup.id, number: user.subgroup.number }
          : null,
      };
      if (!user.groupId || !user.studyGroup || !user.subgroup) {
        return json({
          ...metadata,
          status: "PROFILE_REQUIRED",
          message: "Выберите группу и подгруппу в профиле.",
          days: [],
        });
      }
      if (user.subgroup.groupId !== user.groupId)
        throw new Error("Invalid membership");
      const left = new Date(`${from}T00:00:00Z`);
      const right = new Date(`${to}T00:00:00Z`);
      const audience = { groupId: user.groupId };
      const schedules = await db.scheduleImport.findMany({
        where: {
          status: "PUBLISHED",
          validFrom: { lte: right },
          validTo: { gte: left },
          semester: {
            startsOn: { lte: right },
            endsOn: { gte: left },
            academicYear: { startsOn: { lte: right }, endsOn: { gte: left } },
          },
          lessons: { some: { audiences: { some: audience } } },
        },
        include: {
          semester: { include: { academicYear: true } },
          holidays: {
            where: { startsOn: { lte: right }, endsOn: { gte: left } },
          },
          // Keep all weekdays and subgroups of this group to distinguish an empty
          // student day from absence of a published group timetable.
          lessons: {
            where: { audiences: { some: audience } },
            include: { subject: true, audiences: { where: audience } },
          },
        },
        orderBy: { id: "asc" },
      });
      const result = calculateStudentSchedule({
        from,
        to,
        student: { groupId: user.groupId, subgroup: user.subgroup },
        schedules,
      });
      return json({ ...metadata, ...result });
    } catch (error) {
      if (error instanceof ScheduleConflictError) {
        return json(
          {
            code: "SCHEDULE_CONFLICT",
            message:
              "Найдены пересекающиеся опубликованные расписания. Обратитесь к администратору.",
          },
          409,
        );
      }
      console.error(
        "[schedule] Не удалось загрузить или рассчитать расписание.",
      );
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
