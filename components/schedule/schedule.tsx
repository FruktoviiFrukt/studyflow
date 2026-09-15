"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MousePointer2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LessonCard from "./lesson-card";
import WeekGrid from "./week-grid";
import DatePicker from "./date-picker";
import { addDays, formatDate, mondayOf, universityToday } from "@/lib/schedule";
import { signOut } from "next-auth/react";
import {
  dayMessage,
  subjectStyle,
  type ScheduleResponse,
} from "@/lib/student-schedule-view";
import { cn } from "@/lib/utils";

export default function Schedule({ initialToday }: { initialToday: string }) {
  const [today, setToday] = useState(initialToday);
  const [selectedDay, setSelectedDay] = useState(initialToday);
  const [view, setView] = useState<"week" | "day">("week");
  useEffect(() => {
    const timer = window.setInterval(() => setToday(universityToday()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const week = mondayOf(selectedDay);
  const [result, setResult] = useState<{
    week: string;
    data?: ScheduleResponse;
    error?: string;
    unauthorized?: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const response = await fetch(
          "/api/schedule?" +
            new URLSearchParams({ from: week, to: addDays(week, 6) }),
          { signal: controller.signal, cache: "no-store" },
        );
        const body = await response.json();
        if (!response.ok) {
          if (active)
            setResult({
              week,
              error: body.message || "Не удалось загрузить расписание.",
              unauthorized: response.status === 401,
            });
          return;
        }
        if (
          !["READY", "PROFILE_REQUIRED"].includes(body.status) ||
          !Array.isArray(body.days) ||
          body.from !== week ||
          body.to !== addDays(week, 6)
        )
          throw new Error("Invalid response");
        if (active) setResult({ week, data: body });
      } catch {
        if (active)
          setResult({
            week,
            error:
              "Не удалось загрузить расписание. Проверьте соединение и попробуйте ещё раз.",
          });
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [week, attempt]);
  const current = result?.week === week ? result : null;
  const data = current?.data;
  const loading = !current;
  const days = data?.days ?? [];
  const lessons = days.flatMap((d) => d.lessons);
  const selected = days.find((d) => d.date === selectedDay);
  const dayLessons = selected?.lessons ?? [];
  const legend = [
    ...new Map(lessons.map((l) => [l.subject.id, l.subject])).values(),
  ];
  const weeks = [
    ...new Map(
      days
        .filter((d) => d.week)
        .map((d) => [d.week!.number + d.week!.parity, d.week!]),
    ).values(),
  ];
  function retry() {
    setResult(null);
    setAttempt((n) => n + 1);
  }
  function goToToday() {
    const date = universityToday();
    setToday(date);
    setSelectedDay(date);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          Личное расписание
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Расписание студента
        </h2>
        {data?.group && (
          <p className="mt-2 text-sm text-gray-500">
            Группа {data.group.name}
            {data.subgroup && ` · Подгруппа ${data.subgroup.number}`}
            {weeks
              .map(
                (w) =>
                  ` · ${w.number}-я неделя, ${w.parity === "ODD" ? "нечётная" : "чётная"}`,
              )
              .join("")}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Вид расписания"
          className="flex rounded-xl border border-gray-200 bg-white p-1"
        >
          {(
            [
              ["week", "Неделя"],
              ["day", "День"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              variant={view === id ? "secondary" : "ghost"}
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={cn(
                "rounded-lg",
                view === id && "bg-blue-50 text-blue-600",
              )}
            >
              {label}
            </Button>
          ))}
        </div>
        <DatePicker
          value={selectedDay}
          today={today}
          onSelect={setSelectedDay}
        />
      </div>
      <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-4 sm:p-5">
          <div>
            <h3
              aria-live="polite"
              aria-atomic="true"
              className="text-base font-semibold first-letter:uppercase sm:text-lg"
            >
              {view === "week"
                ? `${formatDate(week, { day: "numeric", month: "short" })} — ${formatDate(addDays(week, 6), { day: "numeric", month: "short", year: "numeric" })}`
                : formatDate(selectedDay, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {data?.status === "READY"
                ? `Занятий: ${view === "week" ? lessons.length : dayLessons.length}`
                : loading
                  ? "Загрузка…"
                  : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {view === "week" && week === mondayOf(today) && (
              <Badge className="border-0 bg-blue-50 text-blue-600">
                Текущая неделя
              </Badge>
            )}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  view === "week" ? "Предыдущая неделя" : "Предыдущий день"
                }
                onClick={() =>
                  setSelectedDay((value) =>
                    addDays(value, view === "week" ? -7 : -1),
                  )
                }
              >
                <ArrowLeft />
              </Button>
              <Button variant="ghost" onClick={goToToday}>
                Сегодня
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  view === "week" ? "Следующая неделя" : "Следующий день"
                }
                onClick={() =>
                  setSelectedDay((value) =>
                    addDays(value, view === "week" ? 7 : 1),
                  )
                }
              >
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
        {loading ? (
          <p role="status" className="p-12 text-center text-sm text-gray-500">
            Загружаем расписание…
          </p>
        ) : current?.error ? (
          <div role="alert" className="space-y-4 p-10 text-center">
            <p>{current.error}</p>
            {current.unauthorized ? (
              <Button onClick={() => signOut({ callbackUrl: "/auth" })}>
                Войти заново
              </Button>
            ) : (
              <Button onClick={retry}>Повторить загрузку</Button>
            )}
          </div>
        ) : data?.status === "PROFILE_REQUIRED" ? (
          <div className="space-y-3 p-10 text-center">
            <h3 className="font-semibold">Заполните профиль</h3>
            <p className="text-sm text-gray-500">
              Для личного расписания необходимо указать группу и подгруппу. Если
              выбор пока недоступен, обратитесь к администратору.
            </p>
            <Button variant="outline" onClick={retry}>
              Проверить снова
            </Button>
          </div>
        ) : view === "week" &&
          days.every((d) => d.status === "NOT_PUBLISHED") ? (
          <p className="p-12 text-center text-gray-600">
            Расписание на эту неделю ещё не опубликовано
          </p>
        ) : view === "week" ? (
          <WeekGrid
            days={days.map((d) => d.date)}
            states={days}
            lessons={lessons}
            today={today}
          />
        ) : (
          <section aria-label="Занятия выбранного дня" className="p-4 sm:p-6">
            {dayLessons.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dayLessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            ) : (
              <div className="py-14 text-center">
                <CalendarDays
                  aria-hidden="true"
                  className="mx-auto mb-3 size-8 text-gray-400"
                />
                <p className="font-medium text-gray-700">
                  {dayMessage(selected)}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {selected?.status === "HOLIDAY"
                    ? "В этот день занятия не проводятся."
                    : "Выберите другую дату в календаре."}
                </p>
              </div>
            )}
          </section>
        )}
        <p className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-500">
          <MousePointer2 aria-hidden="true" className="size-3.5 shrink-0" />
          Нажмите на занятие, чтобы посмотреть подробности
        </p>
      </Card>
      <section
        aria-label="Обозначения предметов"
        className="flex flex-wrap gap-x-5 gap-y-3"
      >
        {legend.map((subject) => (
          <span
            key={subject.id}
            className="inline-flex items-center gap-2 text-xs text-gray-600"
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                subjectStyle(subject.colorKey).dot,
              )}
            />
            {subject.name}
          </span>
        ))}
      </section>
    </div>
  );
}
