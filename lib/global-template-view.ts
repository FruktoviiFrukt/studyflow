import { SLOTS, type AdminLesson } from "./admin-schedule.ts";
import type { TemplateLesson } from "./server/global-schedule-template.ts";

export type TemplateGroup = { id: string; name: string };
export type TemplateDay = { weekday: number; lessons: TemplateLesson[] };
export type TemplateResponse = {
  academicYear: string | null;
  semester: number | null;
  groups: TemplateGroup[];
  days: TemplateDay[];
};
export type TemplateInterval = { startMinutes: number; endMinutes: number };

export function streamOf(groupName: string) {
  return groupName.split("-")[0];
}

export function adminGlobalTemplate(lessons: AdminLesson[]): TemplateResponse {
  const names = [
    ...new Set(
      lessons.flatMap((lesson) => lesson.audiences.map((a) => a.group)),
    ),
  ].sort();
  const minutes = (value: string) => {
    const [hours, rest] = value.split(":").map(Number);
    return hours * 60 + rest;
  };
  const mapped: TemplateLesson[] = lessons.map((lesson) => ({
    id: lesson.id,
    weekday: lesson.day,
    startMinutes: minutes(lesson.start),
    endMinutes: minutes(lesson.end),
    weekPattern:
      lesson.parity === "odd"
        ? "ODD"
        : lesson.parity === "even"
          ? "EVEN"
          : "EVERY",
    groupIds: [...new Set(lesson.audiences.map((a) => a.group))],
    subject: { id: lesson.subject, name: lesson.subject, colorKey: "blue" },
    type:
      lesson.type === "Лекция"
        ? "LECTURE"
        : lesson.type === "Лабораторная"
          ? "LABORATORY"
          : lesson.type === "Практика"
            ? "PRACTICE"
            : "SEMINAR",
    teacher: lesson.teacher || null,
    classroom: lesson.room || null,
    topic: lesson.topic || null,
  }));
  return {
    academicYear: null,
    semester: null,
    groups: names.map((name) => ({ id: name, name })),
    days: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      lessons: mapped.filter((lesson) => lesson.weekday === weekday),
    })),
  };
}

export function templateIntervals(days: TemplateDay[]): TemplateInterval[] {
  const intervals = new Map<string, TemplateInterval>();
  for (const slot of SLOTS) {
    const [start, end] = slot.split("–");
    const minutes = (value: string) => {
      const [hours, rest] = value.split(":").map(Number);
      return hours * 60 + rest;
    };
    const interval = { startMinutes: minutes(start), endMinutes: minutes(end) };
    intervals.set(`${interval.startMinutes}:${interval.endMinutes}`, interval);
  }
  for (const day of days)
    for (const lesson of day.lessons)
      intervals.set(`${lesson.startMinutes}:${lesson.endMinutes}`, {
        startMinutes: lesson.startMinutes,
        endMinutes: lesson.endMinutes,
      });
  return [...intervals.values()].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes,
  );
}

export function templateCells(
  lessons: TemplateLesson[],
  groups: TemplateGroup[],
  interval: TemplateInterval,
) {
  const byGroup = groups.map((group) =>
    lessons.filter(
      (lesson) =>
        lesson.startMinutes === interval.startMinutes &&
        lesson.endMinutes === interval.endMinutes &&
        lesson.groupIds.includes(group.id),
    ),
  );
  const cells: { groupId: string; span: number; lessons: TemplateLesson[] }[] =
    [];
  for (let index = 0; index < groups.length;) {
    const items = byGroup[index];
    let span = 1;
    if (items.length === 1)
      while (
        index + span < groups.length &&
        byGroup[index + span].length === 1 &&
        byGroup[index + span][0].id === items[0].id
      )
        span++;
    cells.push({ groupId: groups[index].id, span, lessons: items });
    index += span;
  }
  return cells;
}
