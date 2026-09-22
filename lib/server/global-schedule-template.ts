import type { ScheduleForCalculation } from "./schedule-calculation.ts";
import { ScheduleConflictError } from "./schedule-calculation.ts";

export type TemplateSchedule = ScheduleForCalculation;
export type TemplateGroup = { id: string; name: string };
export type TemplateLesson = {
  id: string;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
  weekPattern: "EVERY" | "ODD" | "EVEN";
  groupIds: string[];
  subject: { id: string; name: string; colorKey: string };
  type: ScheduleForCalculation["lessons"][number]["type"];
  teacher: string | null;
  classroom: string | null;
  topic: string | null;
};

/** A weekly template has no calendar date: holidays and academic week numbers do not apply. */
export function calculateGlobalTemplate(
  schedules: TemplateSchedule[],
  groups: TemplateGroup[],
  course: number,
  semester: 1 | 2,
) {
  const published = schedules.filter(
    (schedule) =>
      schedule.kind === "GLOBAL" &&
      schedule.status === "PUBLISHED" &&
      schedule.course === course &&
      schedule.semester.number === semester,
  );
  const latest = published.reduce<TemplateSchedule | null>(
    (current, schedule) => {
      if (!current) return schedule;
      const year = schedule.semester.academicYear.startsOn.getTime();
      const previous = current.semester.academicYear.startsOn.getTime();
      return year > previous ? schedule : current;
    },
    null,
  );
  if (!latest)
    return { course, academicYear: null, semester, groups: [], days: [] };

  const term = published.filter(
    (schedule) => schedule.semesterId === latest.semesterId,
  );
  const byGroup = new Map<string, TemplateSchedule>();
  for (const schedule of term) {
    const audienceIds = new Set(
      schedule.lessons.flatMap((lesson) =>
        lesson.audiences.map((audience) => audience.groupId),
      ),
    );
    for (const groupId of audienceIds) {
      const previous = byGroup.get(groupId);
      if (
        previous &&
        previous.id !== schedule.id &&
        previous.validFrom.getTime() === schedule.validFrom.getTime()
      )
        throw new ScheduleConflictError(
          `Несколько глобальных расписаний группы ${groupId} в одном семестре.`,
        );
      if (!previous || previous.validFrom < schedule.validFrom)
        byGroup.set(groupId, schedule);
    }
  }
  const visibleGroups = groups
    .filter((group) => byGroup.has(group.id))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const lessons: TemplateLesson[] = term.flatMap((schedule) =>
    schedule.lessons.flatMap((lesson) => {
      const groupIds = [
        ...new Set(
          lesson.audiences
            .filter(
              (audience) => byGroup.get(audience.groupId)?.id === schedule.id,
            )
            .map((audience) => audience.groupId),
        ),
      ];
      if (!groupIds.length) return [];
      return [
        {
          id: lesson.id,
          weekday: lesson.weekday,
          startMinutes: lesson.startMinutes,
          endMinutes: lesson.endMinutes,
          weekPattern: lesson.weekPattern,
          groupIds,
          subject: {
            id: lesson.subject.id,
            name: lesson.subject.name,
            colorKey: lesson.subject.colorKey,
          },
          type: lesson.type,
          teacher: lesson.teacher,
          classroom: lesson.classroom,
          topic: lesson.topic,
        },
      ];
    }),
  );
  return {
    course,
    academicYear: latest.semester.academicYear.name,
    semester: latest.semester.number,
    groups: visibleGroups,
    days: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      lessons: lessons
        .filter((lesson) => lesson.weekday === weekday)
        .sort(
          (a, b) =>
            a.startMinutes - b.startMinutes ||
            a.endMinutes - b.endMinutes ||
            a.id.localeCompare(b.id),
        ),
    })),
  };
}
