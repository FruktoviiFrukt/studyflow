import {
  compareDatedLessons,
  dateForDay,
  datedLesson,
  holidaysForDay,
  lessonOnDay,
  prepareSchedulePeriod,
  validateScheduleRange,
  weekForDay,
  ScheduleConflictError,
} from "./schedule-calculation.ts";
import type {
  DatedLesson,
  DayStatus,
  ScheduleForCalculation,
  ScheduleWeek,
} from "./schedule-calculation.ts";

export {
  academicWeek,
  MAX_SCHEDULE_DAYS,
  ScheduleConflictError,
  validateScheduleRange,
} from "./schedule-calculation.ts";
export type {
  DatedLesson,
  ScheduleForCalculation,
} from "./schedule-calculation.ts";

export type StudentMembership = {
  groupId: string | null;
};

export type ScheduleDay = {
  date: string;
  status: DayStatus;
  week: ScheduleWeek | null;
  scheduleId: string | null;
  holidays: { id: string; name: string }[];
  lessons: DatedLesson[];
};

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
  const { start, end } = validateScheduleRange(from, to);
  if (!student.groupId) return { status: "PROFILE_REQUIRED", days: [] };
  const published = schedules.filter(
    (schedule) =>
      schedule.status === "PUBLISHED" &&
      schedule.lessons.some((lesson) =>
        lesson.audiences.some(
          (audience) => audience.groupId === student.groupId,
        ),
      ),
  );
  const periods = published.map(prepareSchedulePeriod);
  const days: ScheduleDay[] = [];
  for (let day = start; day <= end; day++) {
    const date = dateForDay(day);
    const active = periods.filter(
      (period) => period.left <= day && day <= period.right,
    );
    // Do not silently mix two published timetables or pick an arbitrary winner.
    if (active.length > 1)
      throw new ScheduleConflictError(
        `Несколько опубликованных расписаний группы на ${date}.`,
      );
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
    const { schedule } = current;
    const week = weekForDay(day, current.first)!;
    const holidays = holidaysForDay(current, day);
    const lessons: DatedLesson[] = holidays.length
      ? []
      : schedule.lessons
          .filter(
            (lesson) =>
              lessonOnDay(lesson, day, week) &&
              lesson.audiences.some(
                (audience) => audience.groupId === student.groupId,
              ),
          )
          .map((lesson) => datedLesson(lesson, schedule.id, date))
          .sort(compareDatedLessons);
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
