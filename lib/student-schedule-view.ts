import type { CSSProperties } from "react";
import { subjects, timeSlots, type Lesson } from "./schedule";
import type { DatedLesson, ScheduleDay } from "./server/student-schedule";

export type ScheduleResponse = {
  status: "READY" | "PROFILE_REQUIRED";
  from: string;
  to: string;
  group: { id: string; name: string } | null;
  days: ScheduleDay[];
};
export type DisplayLesson = Lesson | DatedLesson;
export const lessonTypes = {
  LECTURE: "Лекция",
  LABORATORY: "Лабораторная",
  PRACTICE: "Семинар",
  SEMINAR: "Семинар",
  UNSPECIFIED: "Семинар",
};
export function subjectStyle(name: string): {
  color: string;
  cardStyle: CSSProperties;
  dotStyle: CSSProperties;
} {
  // Timing notes in parentheses do not change the subject's color.
  const normalized = name
    .replace(/\s*\([^)]*\)\s*$/u, "")
    .trim()
    .toLocaleLowerCase("ro-RO");
  let hash = 0;
  for (const char of normalized) {
    hash = Math.imul(hash, 31) + char.codePointAt(0)!;
  }
  const hue = (hash >>> 0) % 360;
  return {
    color: "",
    cardStyle: {
      borderLeftColor: `hsl(${hue} 70% 51%)`,
      backgroundColor: `hsl(${hue} 80% 96%)`,
      color: `hsl(${hue} 55% 19%)`,
    },
    dotStyle: { backgroundColor: `hsl(${hue} 70% 51%)` },
  };
}
export function minutesLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function displayLesson(lesson: DisplayLesson) {
  if ("slot" in lesson)
    return {
      subject: { ...subjects[lesson.subject], cardStyle: undefined },
      slot: timeSlots[lesson.slot],
      type: lesson.type,
      demo: true,
    };
  return {
    subject: {
      ...subjectStyle(lesson.subject.name),
      name: lesson.subject.name,
    },
    slot: {
      start: minutesLabel(lesson.startMinutes),
      end: minutesLabel(lesson.endMinutes),
    },
    type: lessonTypes[lesson.type],
    demo: false,
  };
}
export function dayMessage(day?: ScheduleDay) {
  if (day?.status === "HOLIDAY")
    return day.holidays.map((h) => h.name).join(" · ") || "Каникулы";
  if (day?.status === "NOT_PUBLISHED") return "Расписание ещё не опубликовано";
  return "На этот день занятий нет";
}
