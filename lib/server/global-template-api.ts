import type { PrismaClient } from "../generated/prisma/client";
import { ScheduleConflictError } from "./schedule-calculation.ts";
import { calculateGlobalTemplate } from "./global-schedule-template.ts";

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

export function createGlobalTemplateGet({ authenticate, db }: Dependencies) {
  return async function getGlobalTemplate(request: Request): Promise<Response> {
    try {
      const userId = (await authenticate())?.user?.id;
      if (!userId)
        return json(
          { code: "UNAUTHORIZED", message: "Войдите в аккаунт." },
          401,
        );
      const params = [...new URL(request.url).searchParams.entries()];
      const course = Number(params.find(([key]) => key === "course")?.[1]);
      const semester = Number(params.find(([key]) => key === "semester")?.[1]);
      if (
        params.length !== 2 ||
        params.filter(([key]) => key === "course").length !== 1 ||
        params.filter(([key]) => key === "semester").length !== 1 ||
        !Number.isInteger(course) ||
        course < 1 ||
        course > 10 ||
        ![1, 2].includes(semester)
      )
        return json(
          { code: "INVALID_QUERY", message: "Выберите курс и семестр." },
          400,
        );
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user)
        return json(
          { code: "UNAUTHORIZED", message: "Аккаунт не найден." },
          401,
        );
      const schedules = await db.scheduleImport.findMany({
        where: {
          kind: "GLOBAL",
          status: "PUBLISHED",
          course,
          semester: { number: semester },
        },
        include: {
          semester: { include: { academicYear: true } },
          holidays: true,
          lessons: {
            include: {
              subject: true,
              audiences: {
                include: { group: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });
      const groups = new Map<string, { id: string; name: string }>();
      for (const schedule of schedules)
        for (const lesson of schedule.lessons)
          for (const audience of lesson.audiences)
            groups.set(audience.group.id, audience.group);
      return json(
        calculateGlobalTemplate(
          schedules,
          [...groups.values()],
          course,
          semester as 1 | 2,
        ),
      );
    } catch (error) {
      if (error instanceof ScheduleConflictError)
        return json(
          {
            code: "SCHEDULE_CONFLICT",
            message: "Найдены конфликтующие публикации.",
          },
          409,
        );
      console.error("[global-template] Не удалось загрузить расписание.");
      return json(
        { code: "INTERNAL_ERROR", message: "Не удалось загрузить расписание." },
        500,
      );
    }
  };
}
