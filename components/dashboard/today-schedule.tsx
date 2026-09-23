"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import { useTodaySchedule } from "./today-schedule-context";

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function TodaySchedule() {
  const { data, isLoading, hasError } = useTodaySchedule();
  const day = data?.days[0];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 xl:col-span-2">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Расписание на сегодня
          </h3>

          <p className="mt-1 text-sm text-gray-500">Занятия на текущий день</p>
        </div>

        <Link
          href="/schedule"
          className="flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          Всё расписание
          <ArrowRight size={16} />
        </Link>
      </div>

      {isLoading && (
        <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
          Загружаем расписание…
        </p>
      )}

      {hasError && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Не удалось загрузить расписание.
        </p>
      )}

      {data?.status === "PROFILE_REQUIRED" && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
          Выберите учебную группу в профиле.
        </p>
      )}

      {day?.status === "NOT_PUBLISHED" && (
        <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          Расписание на сегодня пока не опубликовано.
        </p>
      )}

      {day?.status === "NO_LESSONS" && (
        <p className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          Сегодня занятий нет.
        </p>
      )}

      {day?.status === "HOLIDAY" && (
        <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
          {day.holidays.map((holiday) => holiday.name).join(", ")}
        </p>
      )}

      {day?.status === "LESSONS" && (
        <div className="space-y-3">
          {day.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex w-full items-center gap-2 text-sm font-semibold text-blue-600 sm:w-36">
                <Clock3 size={15} />
                {formatTime(lesson.startMinutes)}–
                {formatTime(lesson.endMinutes)}
              </div>

              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {lesson.subject.name}
                </p>

                <p className="mt-1 text-sm text-gray-500">{lesson.type}</p>
              </div>

              {lesson.classroom && (
                <div className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-600">
                  Каб. {lesson.classroom}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
