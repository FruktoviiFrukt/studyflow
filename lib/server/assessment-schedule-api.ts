import type { PrismaClient } from "../generated/prisma/client";
import { dateForDay, validateScheduleRange } from "./schedule-calculation";
import type { DatedLesson, ScheduleDay } from "./student-schedule";

type Dependencies = {
  authenticate: () => Promise<{ user?: { id?: string } } | null>;
  db: Pick<PrismaClient, "user" | "studyGroup" | "lesson">;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}

// Assessment lessons are one-off dated rows (Lesson.date), not a weekly
// template expanded across a range like STUDENT/GLOBAL — so this reads them
// directly instead of reusing schedule-calculation.ts's week-expansion path.
export function createAssessmentScheduleGet({
  authenticate,
  db,
}: Dependencies) {
  return async function getAssessmentSchedule(
    request: Request,
  ): Promise<Response> {
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
      )
        return json(
          {
            code: "INVALID_RANGE",
            message:
              "Передайте только from и to по одному разу, в формате YYYY-MM-DD.",
          },
          400,
        );
      const from = params.get("from")!;
      const to = params.get("to")!;
      try {
        validateScheduleRange(from, to);
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        return json({ code: "INVALID_RANGE", message: error.message }, 400);
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          groupId: true,
          group: true,
          studyGroup: { select: { id: true, name: true } },
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
      const studyGroup =
        user.studyGroup ||
        (user.group
          ? await db.studyGroup.findUnique({
              where: { name: user.group },
              select: { id: true, name: true },
            })
          : null);
      const groupId = studyGroup?.id ?? null;
      const metadata = {
        from,
        to,
        timeZone: "Europe/Chisinau",
        group: studyGroup,
      };
      if (!groupId)
        return json({
          ...metadata,
          status: "PROFILE_REQUIRED",
          message: "Выберите группу в профиле.",
          days: [],
        });

      const left = new Date(`${from}T00:00:00Z`);
      const right = new Date(`${to}T00:00:00Z`);
      const rows = await db.lesson.findMany({
        where: {
          date: { gte: left, lte: right },
          schedule: { kind: "ASSESSMENT", status: "PUBLISHED" },
          audiences: { some: { groupId } },
        },
        include: { subject: true },
        orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
      });

      const byDate = new Map<string, DatedLesson[]>();
      for (const row of rows) {
        // `date` is guaranteed non-null by the where clause above.
        const date = row.date!.toISOString().slice(0, 10);
        const lesson: DatedLesson = {
          id: row.id,
          lessonId: row.id,
          scheduleId: row.scheduleId,
          date,
          startMinutes: row.startMinutes,
          endMinutes: row.endMinutes,
          subject: {
            id: row.subject.id,
            name: row.subject.name,
            colorKey: row.subject.colorKey,
          },
          type: row.type,
          teacher: row.teacher,
          classroom: row.classroom,
          topic: row.topic,
        };
        const existing = byDate.get(date);
        if (existing) existing.push(lesson);
        else byDate.set(date, [lesson]);
      }

      const { start, end } = validateScheduleRange(from, to);
      const days: ScheduleDay[] = [];
      for (let day = start; day <= end; day++) {
        const date = dateForDay(day);
        const lessons = byDate.get(date) ?? [];
        days.push({
          date,
          status: lessons.length ? "LESSONS" : "NO_LESSONS",
          week: null,
          scheduleId: null,
          holidays: [],
          lessons,
        });
      }

      return json({ status: "READY", ...metadata, days });
    } catch (error) {
      if (error instanceof RangeError)
        return json({ code: "INVALID_RANGE", message: error.message }, 400);
      console.error(
        "[assessment-schedule] Не удалось загрузить расписание.",
        error,
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
