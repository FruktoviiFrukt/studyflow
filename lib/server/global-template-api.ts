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
      if (new URL(request.url).search)
        return json(
          { code: "INVALID_QUERY", message: "Параметры не требуются." },
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
        where: { kind: "GLOBAL", status: "PUBLISHED" },
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
      return json(calculateGlobalTemplate(schedules, [...groups.values()]));
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
