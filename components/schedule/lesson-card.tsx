"use client";

import {
  BookOpen,
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/schedule";
import { displayLesson, type DisplayLesson } from "@/lib/student-schedule-view";
import { cn } from "@/lib/utils";

export default function LessonCard({ lesson }: { lesson: DisplayLesson }) {
  const { subject, slot, type, demo } = displayLesson(lesson);
  const details = [
    {
      label: "Дата",
      value: formatDate(lesson.date, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      icon: CalendarDays,
    },
    { label: "Время", value: `${slot.start} – ${slot.end}`, icon: Clock3 },
    {
      label: "Аудитория",
      value: lesson.classroom || "Не указана",
      icon: MapPin,
    },
    {
      label: "Преподаватель",
      value: lesson.teacher || "Не указан",
      icon: UserRound,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          style={subject.cardStyle}
          aria-label={`${subject.name}, ${type}, ${formatDate(lesson.date, { day: "numeric", month: "long" })}, ${slot.start}–${slot.end}, аудитория ${lesson.classroom}. Подробнее`}
          className={cn(
            "flex min-h-32 w-full flex-col items-start rounded-xl border-l-[3px] p-3 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
            subject.color,
          )}
        >
          <span className="text-[11px] font-medium opacity-75">
            {slot.start} – {slot.end}
          </span>
          <span className="mt-1.5 text-sm font-semibold leading-5 [overflow-wrap:anywhere]">
            {subject.name}
          </span>
          <span className="mt-1 text-xs opacity-80">{type}</span>
          {lesson.teacher && (
            <span className="mt-1 text-xs opacity-80">{lesson.teacher}</span>
          )}
          <span className="mt-auto flex items-center gap-1.5 pt-3 text-xs opacity-80">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            {lesson.classroom || "Аудитория не указана"}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border-gray-200 bg-white p-6 text-gray-900 sm:max-w-md">
        <DialogHeader className="text-left">
          <div
            style={subject.cardStyle}
            className={cn(
              "mb-3 flex size-12 items-center justify-center rounded-xl border-l-[3px]",
              subject.color,
            )}
          >
            <BookOpen aria-hidden="true" className="size-6" />
          </div>
          <DialogTitle className="pr-5 text-xl leading-7">
            {subject.name}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {type}
            {demo && " · Демонстрационное занятие"}
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-4 py-2 text-sm">
          {details.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex gap-3">
              <Icon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-gray-400"
              />
              <div>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
        {lesson.topic && (
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">Тема занятия</p>
            <p className="mt-1 text-sm leading-6">{lesson.topic}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
