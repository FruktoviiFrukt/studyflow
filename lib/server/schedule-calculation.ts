import type { Prisma } from "../generated/prisma/client";

export type ScheduleForCalculation = Prisma.ScheduleImportGetPayload<{
  include: {
    semester: { include: { academicYear: true } };
    holidays: true;
    lessons: { include: { subject: true; audiences: true } };
  };
}>;

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

export type ScheduleWeek = { number: number; parity: "ODD" | "EVEN" };
export type DayStatus = "NOT_PUBLISHED" | "HOLIDAY" | "NO_LESSONS" | "LESSONS";

const DAY_MS = 86_400_000;
export const MAX_SCHEDULE_DAYS = 366;

export class ScheduleConflictError extends Error {}

export function dayNumber(value: string): number {
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

export function dateForDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
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

export function weekday(day: number): number {
  return (new Date(day * DAY_MS).getUTCDay() + 6) % 7;
}

export function validateScheduleRange(
  from: string,
  to: string,
  maxDays = MAX_SCHEDULE_DAYS,
) {
  const start = dayNumber(from);
  const end = dayNumber(to);
  if (end < start || end - start + 1 > maxDays) {
    throw new RangeError(`Период должен составлять от 1 до ${maxDays} дней.`);
  }
  return { start, end };
}

export function weekForDay(day: number, first: number): ScheduleWeek | null {
  if (weekday(first) !== 0)
    throw new RangeError("Начало отсчёта должно быть понедельником.");
  if (day < first) return null;
  const number = Math.floor((day - first) / 7) + 1;
  return { number, parity: number % 2 ? "ODD" : "EVEN" };
}

/** Continuous academic weeks, independent of semesters and holiday periods. */
export function academicWeek(date: string, firstOddWeekMonday: string) {
  return weekForDay(dayNumber(date), dayNumber(firstOddWeekMonday));
}

export function prepareSchedulePeriod(schedule: ScheduleForCalculation) {
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
}

export type SchedulePeriod = ReturnType<typeof prepareSchedulePeriod>;

export function holidaysForDay(period: SchedulePeriod, day: number) {
  return period.holidays
    .filter(({ left, right }) => left <= day && day <= right)
    .map(({ holiday }) => ({ id: holiday.id, name: holiday.name }));
}

export function lessonOnDay(
  lesson: ScheduleForCalculation["lessons"][number],
  day: number,
  week: ScheduleWeek,
) {
  return (
    lesson.weekday === weekday(day) &&
    (lesson.weekPattern === "EVERY" || lesson.weekPattern === week.parity)
  );
}

export function datedLesson(
  lesson: ScheduleForCalculation["lessons"][number],
  scheduleId: string,
  date: string,
): DatedLesson {
  return {
    id: `${lesson.id}:${date}`,
    lessonId: lesson.id,
    scheduleId,
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
  };
}

export function compareDatedLessons(a: DatedLesson, b: DatedLesson) {
  return (
    a.startMinutes - b.startMinutes ||
    a.endMinutes - b.endMinutes ||
    a.lessonId.localeCompare(b.lessonId)
  );
}
