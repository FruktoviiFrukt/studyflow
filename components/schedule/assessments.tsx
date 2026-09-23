"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "next-auth/react";
import WeekGrid from "./week-grid";
import DatePicker from "./date-picker";
import { addDays, mondayOf, universityToday, weekLabel } from "@/lib/schedule";
import {
  subjectStyle,
  type ScheduleResponse,
} from "@/lib/student-schedule-view";

export default function Assessments({
  initialToday,
}: {
  initialToday: string;
}) {
  const [selectedDay, setSelectedDay] = useState(initialToday);
  const week = mondayOf(selectedDay);
  const [today, setToday] = useState(initialToday);
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
          "/api/schedule/assessments?" +
            new URLSearchParams({ from: week, to: addDays(week, 4) }),
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
          !Array.isArray(body.days)
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
  const legend = [
    ...new Map(lessons.map((l) => [l.subject.id, l.subject])).values(),
  ];

  function retry() {
    setResult(null);
    setAttempt((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          Проверка знаний
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Аттестации и экзамены
        </h2>
        {data?.group && (
          <p className="mt-2 text-sm text-gray-500">Группа {data.group.name}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <DatePicker
          value={selectedDay}
          today={today}
          onSelect={setSelectedDay}
        />
      </div>
      <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h3
              aria-live="polite"
              aria-atomic="true"
              className="text-lg font-semibold"
            >
              {weekLabel(week)}
            </h3>
            <p aria-live="polite" className="mt-1 text-sm text-gray-500">
              {data?.status === "READY"
                ? `Событий: ${lessons.length}`
                : loading
                  ? "Загрузка…"
                  : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Предыдущая неделя"
              onClick={() => setSelectedDay((value) => addDays(value, -7))}
            >
              <ArrowLeft />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const date = universityToday();
                setToday(date);
                setSelectedDay(date);
              }}
            >
              Сегодня
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Следующая неделя"
              onClick={() => setSelectedDay((value) => addDays(value, 7))}
            >
              <ArrowRight />
            </Button>
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
              Для расписания аттестаций необходимо указать группу в профиле.
            </p>
            <Button variant="outline" onClick={retry}>
              Проверить снова
            </Button>
          </div>
        ) : days.every((d) => d.status !== "LESSONS") ? (
          <p className="p-12 text-center text-gray-600">
            На эту неделю аттестации ещё не опубликованы
          </p>
        ) : (
          <WeekGrid
            days={Array.from({ length: 5 }, (_, day) => addDays(week, day))}
            states={days}
            lessons={lessons}
            today={today}
          />
        )}
      </Card>
      {legend.length > 0 && (
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
                className="size-2 rounded-full"
                style={subjectStyle(subject.name).dotStyle}
              />
              {subject.name}
            </span>
          ))}
        </section>
      )}
    </div>
  );
}
