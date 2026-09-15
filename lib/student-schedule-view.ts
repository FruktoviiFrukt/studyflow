import { subjects, timeSlots, type Lesson } from "./schedule";
import type { DatedLesson, ScheduleDay } from "./server/student-schedule";

export type ScheduleResponse = {
  status: "READY" | "PROFILE_REQUIRED";
  from: string;
  to: string;
  group: { id: string; name: string } | null;
  subgroup: { id: string; number: number } | null;
  days: ScheduleDay[];
};
export type DisplayLesson = Lesson | DatedLesson;
export const lessonTypes = {
  LECTURE: "Лекция",
  LABORATORY: "Лабораторная",
  PRACTICE: "Практика",
  SEMINAR: "Семинар",
  UNSPECIFIED: "Занятие",
};
const colors = {
  blue: subjects.programming,
  violet: subjects.math,
  emerald: subjects.databases,
  amber: subjects.networks,
  rose: subjects.english,
};
export function subjectStyle(key: string) {
  return colors[key as keyof typeof colors] ?? colors.blue;
}
export function minutesLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function displayLesson(lesson: DisplayLesson) {
  if ("slot" in lesson)
    return {
      subject: subjects[lesson.subject],
      slot: timeSlots[lesson.slot],
      type: lesson.type,
      demo: true,
    };
  return {
    subject: {
      ...subjectStyle(lesson.subject.colorKey),
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
