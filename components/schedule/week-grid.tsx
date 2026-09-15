"use client";

import LessonCard from "./lesson-card";
import { formatDate, timeSlots } from "@/lib/schedule";
import {
  displayLesson,
  dayMessage,
  type DisplayLesson,
} from "@/lib/student-schedule-view";
import type { ScheduleDay } from "@/lib/server/student-schedule";
import { cn } from "@/lib/utils";

export default function WeekGrid({
  days,
  lessons,
  today,
  states,
}: {
  days: string[];
  lessons: DisplayLesson[];
  today: string;
  states?: ScheduleDay[];
}) {
  const baseSlots = states
    ? [
        ...timeSlots,
        { start: "17:00", end: "18:30" },
        { start: "18:45", end: "20:15" },
      ]
    : [...timeSlots];
  const slots = [
    ...new Map(
      [...baseSlots, ...lessons.map((l) => displayLesson(l).slot)].map(
        (slot) => [`${slot.start}-${slot.end}`, slot],
      ),
    ).values(),
  ].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
  );
  return (
    <div
      className="relative max-w-full overflow-x-auto focus-visible:outline-blue-600"
      tabIndex={0}
      role="region"
      aria-label="Недельное расписание, прокрутка по горизонтали"
    >
      <table
        className="w-full min-w-[880px] table-fixed border-collapse text-left"
        style={{ minWidth: Math.max(880, 82 + days.length * 170) }}
        aria-label="Недельное расписание"
      >
        <thead>
          <tr className="border-b border-gray-200">
            <th
              scope="col"
              className="w-[82px] px-3 py-5 text-xs font-medium text-gray-400"
            >
              Время
            </th>
            {days.map((date) => (
              <th
                key={date}
                scope="col"
                aria-current={date === today ? "date" : undefined}
                className={cn(
                  "border-l border-gray-100 px-3 py-4",
                  date === today && "bg-blue-50/60",
                )}
              >
                <div
                  className={cn(
                    "text-xs font-medium first-letter:uppercase",
                    date === today ? "text-blue-600" : "text-gray-500",
                  )}
                >
                  {formatDate(date, { weekday: "long" })}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-lg font-semibold",
                      date === today
                        ? "bg-blue-600 text-white"
                        : "text-gray-900",
                    )}
                  >
                    {formatDate(date, { day: "numeric" })}
                  </span>
                  {date === today && (
                    <span className="text-[10px] font-semibold text-blue-600">
                      Сегодня
                    </span>
                  )}
                </div>
                {states?.find((d) => d.date === date)?.status !== "LESSONS" &&
                  states && (
                    <p className="mt-2 text-xs font-normal text-gray-500">
                      {dayMessage(states.find((d) => d.date === date))}
                    </p>
                  )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr
              key={`${slot.start}-${slot.end}`}
              className="border-b border-gray-100 last:border-0"
            >
              <th scope="row" className="px-3 py-5 align-top">
                <span className="block text-sm font-semibold text-gray-600">
                  {slot.start}
                </span>
                <span className="mt-1 block text-xs font-normal text-gray-400">
                  {slot.end}
                </span>
                <span className="mt-3 block text-[10px] font-normal text-gray-400">
                  {baseSlots.findIndex(
                    (s) => s.start === slot.start && s.end === slot.end,
                  ) >= 0
                    ? `${baseSlots.findIndex((s) => s.start === slot.start && s.end === slot.end) + 1} пара`
                    : "Другое время"}
                </span>
              </th>
              {days.map((date) => {
                const matches = lessons.filter(
                  (lesson) =>
                    lesson.date === date &&
                    displayLesson(lesson).slot.start === slot.start &&
                    displayLesson(lesson).slot.end === slot.end,
                );
                return (
                  <td
                    key={date}
                    className={cn(
                      "h-[152px] border-l border-gray-100 p-2 align-top",
                      date === today && "bg-blue-50/30",
                    )}
                  >
                    {matches.length ? (
                      <div className="grid gap-2">
                        {matches.map((lesson) => (
                          <LessonCard key={lesson.id} lesson={lesson} />
                        ))}
                      </div>
                    ) : (
                      <span className="sr-only">Нет занятий</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
