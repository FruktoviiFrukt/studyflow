import type {
  GlobalGroup,
  GlobalGroupState,
  GlobalLesson,
  GlobalScheduleDay,
} from "./server/global-schedule.ts";

export type GlobalScheduleResponse = {
  course: number;
  from: string;
  to: string;
  timeZone: string;
  groups: GlobalGroup[];
  days: GlobalScheduleDay[];
};

export type TimeInterval = { startMinutes: number; endMinutes: number };
export type GlobalCell = {
  groupId: string;
  span: number;
  lessons: GlobalLesson[];
  state: GlobalGroupState;
};

export function weekIntervals(
  days: GlobalScheduleDay[],
  visibleGroupIds?: Set<string>,
): TimeInterval[] {
  const intervals = new Map<string, TimeInterval>();
  for (const day of days)
    for (const lesson of day.lessons) {
      if (
        visibleGroupIds &&
        !lesson.groupIds.some((id) => visibleGroupIds.has(id))
      )
        continue;
      const interval = {
        startMinutes: lesson.startMinutes,
        endMinutes: lesson.endMinutes,
      };
      intervals.set(
        `${interval.startMinutes}:${interval.endMinutes}`,
        interval,
      );
    }
  return [...intervals.values()].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes,
  );
}

export function globalCells(
  day: GlobalScheduleDay,
  groups: GlobalGroup[],
  interval: TimeInterval | null,
): GlobalCell[] {
  const states = new Map(
    day.groupStates.map((state) => [state.groupId, state]),
  );
  const byGroup = groups.map((group) =>
    interval
      ? day.lessons.filter(
          (lesson) =>
            lesson.startMinutes === interval.startMinutes &&
            lesson.endMinutes === interval.endMinutes &&
            lesson.groupIds.includes(group.id),
        )
      : [],
  );
  const cells: GlobalCell[] = [];
  for (let index = 0; index < groups.length;) {
    const lessons = byGroup[index];
    let span = 1;
    // Merge only identical single lessons in adjacent visible columns.
    if (lessons.length === 1)
      while (
        index + span < groups.length &&
        byGroup[index + span].length === 1 &&
        byGroup[index + span][0].id === lessons[0].id
      )
        span++;
    cells.push({
      groupId: groups[index].id,
      span,
      lessons,
      state: states.get(groups[index].id)!,
    });
    index += span;
  }
  return cells;
}
