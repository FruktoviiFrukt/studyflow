import {
  compareDatedLessons,
  dateForDay,
  datedLesson,
  holidaysForDay,
  lessonOnDay,
  prepareSchedulePeriod,
  ScheduleConflictError,
  validateScheduleRange,
  weekForDay,
} from "./schedule-calculation.ts";
import type {
  DatedLesson,
  DayStatus,
  ScheduleForCalculation,
  ScheduleWeek,
} from "./schedule-calculation.ts";

export type GlobalGroup = { id: string; name: string };
export type GlobalLesson = DatedLesson & { groupIds: string[] };
export type GlobalGroupState = {
  groupId: string;
  status: DayStatus;
  week: ScheduleWeek | null;
  scheduleId: string | null;
  holidays: { id: string; name: string }[];
};
export type GlobalScheduleDay = {
  date: string;
  groupStates: GlobalGroupState[];
  lessons: GlobalLesson[];
};

/** Pure calculation over all groups of one course; no database access. */
export function calculateGlobalSchedule({
  course,
  from,
  to,
  groups,
  schedules,
}: {
  course: number;
  from: string;
  to: string;
  groups: GlobalGroup[];
  schedules: ScheduleForCalculation[];
}): { groups: GlobalGroup[]; days: GlobalScheduleDay[] } {
  if (!Number.isInteger(course) || course < 1 || course > 10)
    throw new RangeError("Курс должен быть целым числом от 1 до 10.");
  const { start, end } = validateScheduleRange(from, to, 7);
  const periods = schedules
    .filter(
      (schedule) =>
        schedule.status === "PUBLISHED" &&
        schedule.kind === "GLOBAL" &&
        schedule.course === course,
    )
    .map(prepareSchedulePeriod)
    .filter((period) => period.left <= end && period.right >= start);
  const periodGroups = periods.map(
    (period) =>
      new Set(
        period.schedule.lessons.flatMap((lesson) =>
          lesson.audiences.map((audience) => audience.groupId),
        ),
      ),
  );
  const audienceIds = new Set(periodGroups.flatMap((ids) => [...ids]));
  const visibleGroups = groups
    .filter((group) => audienceIds.has(group.id))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

  const days: GlobalScheduleDay[] = [];
  for (let day = start; day <= end; day++) {
    const date = dateForDay(day);
    const groupStates: GlobalGroupState[] = [];
    const lessons = new Map<string, GlobalLesson>();
    for (const group of visibleGroups) {
      const active = periods.filter(
        (period, index) =>
          period.left <= day &&
          day <= period.right &&
          periodGroups[index].has(group.id),
      );
      if (active.length > 1)
        throw new ScheduleConflictError(
          `Несколько опубликованных расписаний группы ${group.name} на ${date}.`,
        );
      const current = active[0];
      if (!current) {
        groupStates.push({
          groupId: group.id,
          status: "NOT_PUBLISHED",
          week: null,
          scheduleId: null,
          holidays: [],
        });
        continue;
      }
      const week = weekForDay(day, current.first)!;
      const holidays = holidaysForDay(current, day);
      let lessonCount = 0;
      if (!holidays.length) {
        for (const lesson of current.schedule.lessons) {
          if (
            !lessonOnDay(lesson, day, week) ||
            !lesson.audiences.some((audience) => audience.groupId === group.id)
          )
            continue;
          lessonCount++;
          const id = `${lesson.id}:${date}`;
          const existing = lessons.get(id);
          if (existing) existing.groupIds.push(group.id);
          else
            lessons.set(id, {
              ...datedLesson(lesson, current.schedule.id, date),
              groupIds: [group.id],
            });
        }
      }
      groupStates.push({
        groupId: group.id,
        status: holidays.length
          ? "HOLIDAY"
          : lessonCount
            ? "LESSONS"
            : "NO_LESSONS",
        week,
        scheduleId: current.schedule.id,
        holidays,
      });
    }
    days.push({
      date,
      groupStates,
      lessons: [...lessons.values()].sort(compareDatedLessons),
    });
  }
  return { groups: visibleGroups, days };
}
