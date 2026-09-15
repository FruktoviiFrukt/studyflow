import type { Prisma } from "../generated/prisma/client";

// Pure calculation over records loaded by the server. No database writes or auth.
export type ScheduleForCalculation = Prisma.ScheduleImportGetPayload<{
  include: {
    semester: { include: { academicYear: true } };
    holidays: true;
    lessons: { include: { subject: true; audiences: true } };
  };
}>;

export type StudentMembership = {
  groupId: string | null;
  subgroup: { id: string; groupId: string } | null;
};

export type DatedLesson = {
  id: string;
  lessonId: string;
  scheduleId: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  subject: { id: string; name: string; colorKey: string };
  type: ScheduleForCalculation["lessons"][number]["type"];
  teacher: string | null;
  classroom: string | null;
  topic: string | null;
};

export type ScheduleDay = {
  date: string;
  status: "NOT_PUBLISHED" | "HOLIDAY" | "NO_LESSONS" | "LESSONS";
  week: { number: number; parity: "ODD" | "EVEN" } | null;
  scheduleId: string | null;
  holidays: { id: string; name: string }[];
  lessons: DatedLesson[];
};

const DAY_MS = 86_400_000;
export const MAX_SCHEDULE_DAYS = 366;

function dayNumber(value: string): number {
  const time = Date.parse(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== value
  ) {
    throw new RangeError("Дата должна существовать и иметь формат YYYY-MM-DD.");
  }
  return time / DAY_MS;
}

function databaseDay(value: Date): number {
  if (
    !Number.isFinite(value.getTime()) ||
    value.getUTCHours() ||
    value.getUTCMinutes() ||
    value.getUTCSeconds() ||
    value.getUTCMilliseconds()
  ) {
    throw new RangeError("Ожидалась дата БД без времени, в UTC.");
  }
  return value.getTime() / DAY_MS;
}

function weekday(day: number): number {
  return (new Date(day * DAY_MS).getUTCDay() + 6) % 7;
}

/** Continuous academic weeks, independent of semesters and holiday periods. */
export function academicWeek(date: string, firstOddWeekMonday: string) {
  const day = dayNumber(date);
  const first = dayNumber(firstOddWeekMonday);
  if (weekday(first) !== 0)
    throw new RangeError("Начало отсчёта должно быть понедельником.");
  if (day < first) return null;
  const number = Math.floor((day - first) / 7) + 1;
  return { number, parity: number % 2 ? ("ODD" as const) : ("EVEN" as const) };
}

/** Dates and all period boundaries are inclusive; times stay in Europe/Chisinau. */
export function calculateStudentSchedule({
  from,
  to,
  student,
  schedules,
}: {
  from: string;
  to: string;
  student: StudentMembership;
  schedules: ScheduleForCalculation[];
}): { status: "PROFILE_REQUIRED" | "READY"; days: ScheduleDay[] } {
  const start = dayNumber(from);
  const end = dayNumber(to);
  if (end < start || end - start + 1 > MAX_SCHEDULE_DAYS) {
    throw new RangeError(
      `Период должен составлять от 1 до ${MAX_SCHEDULE_DAYS} дней.`,
    );
  }
  if (!student.groupId || !student.subgroup)
    return { status: "PROFILE_REQUIRED", days: [] };
  if (student.subgroup.groupId !== student.groupId)
    throw new Error("Подгруппа не принадлежит группе студента.");
  const subgroupId = student.subgroup.id;
  const published = schedules.filter(
    (schedule) =>
      schedule.status === "PUBLISHED" &&
      schedule.lessons.some((lesson) =>
        lesson.audiences.some(
          (audience) => audience.groupId === student.groupId,
        ),
      ),
  );
  const periods = published.map((schedule) => {
    const year = schedule.semester.academicYear;
    const first = databaseDay(year.firstOddWeekMonday);
    if (weekday(first) !== 0)
      throw new RangeError("Начало отсчёта должно быть понедельником.");
    const bounds = [
      [schedule.validFrom, schedule.validTo],
      [schedule.semester.startsOn, schedule.semester.endsOn],
      [year.startsOn, year.endsOn],
    ];
    const ranges = bounds.map(([a, b]) => {
      const left = databaseDay(a),
        right = databaseDay(b);
      if (left > right)
        throw new RangeError("Некорректные границы учебного периода.");
      return [left, right];
    });
    const holidays = schedule.holidays.map((holiday) => {
      const left = databaseDay(holiday.startsOn),
        right = databaseDay(holiday.endsOn);
      if (left > right) throw new RangeError("Некорректные границы каникул.");
      return { holiday, left, right };
    });
    return {
      schedule,
      first,
      left: Math.max(first, ...ranges.map(([a]) => a)),
      right: Math.min(...ranges.map(([, b]) => b)),
      holidays,
    };
  });
  const days: ScheduleDay[] = [];
  for (let day = start; day <= end; day++) {
    const date = new Date(day * DAY_MS).toISOString().slice(0, 10);
    const active = periods.filter(
      (period) => period.left <= day && day <= period.right,
    );
    // Do not silently mix two published timetables or pick an arbitrary winner.
    if (active.length > 1)
      throw new Error(`Несколько опубликованных расписаний группы на ${date}.`);
    const current = active[0];
    if (!current) {
      days.push({
        date,
        status: "NOT_PUBLISHED",
        week: null,
        scheduleId: null,
        holidays: [],
        lessons: [],
      });
      continue;
    }
    const { schedule, first } = current;
    const number = Math.floor((day - first) / 7) + 1;
    const week = {
      number,
      parity: number % 2 ? ("ODD" as const) : ("EVEN" as const),
    };
    const holidays = current.holidays
      .filter(({ left, right }) => left <= day && day <= right)
      .map(({ holiday }) => ({ id: holiday.id, name: holiday.name }));
    const lessons: DatedLesson[] = holidays.length
      ? []
      : schedule.lessons
          .filter(
            (lesson) =>
              lesson.weekday === weekday(day) &&
              (lesson.weekPattern === "EVERY" ||
                lesson.weekPattern === week.parity) &&
              lesson.audiences.some(
                (audience) =>
                  audience.groupId === student.groupId &&
                  (audience.subgroupId === null ||
                    audience.subgroupId === subgroupId),
              ),
          )
          .map((lesson) => ({
            id: `${lesson.id}:${date}`,
            lessonId: lesson.id,
            scheduleId: schedule.id,
            date,
            startMinutes: lesson.startMinutes,
            endMinutes: lesson.endMinutes,
            subject: {
              id: lesson.subject.id,
              name: lesson.subject.name,
              colorKey: lesson.subject.colorKey,
            },
            type: lesson.type,
            teacher: lesson.teacher,
            classroom: lesson.classroom,
            topic: lesson.topic,
          }))
          .sort(
            (a, b) =>
              a.startMinutes - b.startMinutes ||
              a.endMinutes - b.endMinutes ||
              a.lessonId.localeCompare(b.lessonId),
          );
    days.push({
      date,
      status: holidays.length
        ? "HOLIDAY"
        : lessons.length
          ? "LESSONS"
          : "NO_LESSONS",
      week,
      scheduleId: schedule.id,
      holidays,
      lessons,
    });
  }
  return { status: "READY", days };
}
