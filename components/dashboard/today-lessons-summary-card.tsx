"use client";

import { CalendarDays } from "lucide-react";

import { useTodaySchedule } from "./today-schedule-context";

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function TodayLessonsSummaryCard() {
  const { data, isLoading, hasError } = useTodaySchedule();
  const day = data?.days[0];

  let value = "—";
  let description = "Загружаем расписание";

  if (hasError) {
    description = "Не удалось загрузить";
  } else if (!isLoading && data?.status === "PROFILE_REQUIRED") {
    description = "Выберите группу в профиле";
  } else if (day?.status === "NOT_PUBLISHED") {
    description = "Расписание не опубликовано";
  } else if (day?.status === "HOLIDAY") {
    value = "0";
    description =
      day.holidays.map((holiday) => holiday.name).join(", ") || "Каникулы";
  } else if (day?.status === "NO_LESSONS") {
    value = "0";
    description = "Сегодня занятий нет";
  } else if (day?.status === "LESSONS") {
    value = String(day.lessons.length);
    description = day.lessons[0]
      ? `Первое занятие в ${formatTime(day.lessons[0].startMinutes)}`
      : "Сегодня занятий нет";
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Занятия сегодня</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <CalendarDays size={21} />
        </div>
      </div>
    </div>
  );
}
