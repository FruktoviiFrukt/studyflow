"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  globalCells,
  weekIntervals,
  type GlobalScheduleResponse,
  type TimeInterval,
} from "@/lib/global-schedule-view";
import { addDays, formatDate, mondayOf, universityToday } from "@/lib/schedule";
import {
  lessonTypes,
  minutesLabel,
  subjectStyle,
} from "@/lib/student-schedule-view";
import DatePicker from "./date-picker";

type LoadResult = {
  key: string;
  data?: GlobalScheduleResponse;
  error?: string;
  unauthorized?: boolean;
};

export default function GlobalSchedule({
  initialToday,
}: {
  initialToday: string;
}) {
  const [today, setToday] = useState(initialToday);
  const [week, setWeek] = useState(mondayOf(initialToday));
  const [course, setCourse] = useState<number | null>(null);
  const [stream, setStream] = useState("all");
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const end = addDays(week, 6);
  const key = course === null ? null : `${course}:${week}`;

  useEffect(() => {
    const timer = window.setInterval(() => setToday(universityToday()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (course === null || key === null) return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const response = await fetch(
          "/api/schedule/global?" +
            new URLSearchParams({
              course: String(course),
              from: week,
              to: end,
            }),
          { signal: controller.signal, cache: "no-store" },
        );
        const body = await response.json();
        if (!response.ok) {
          if (active)
            setResult({
              key: key!,
              error: body.message || "Не удалось загрузить расписание.",
              unauthorized: response.status === 401,
            });
          return;
        }
        if (
          body.course !== course ||
          body.from !== week ||
          body.to !== end ||
          !Array.isArray(body.groups) ||
          !Array.isArray(body.days) ||
          body.days.length !== 7
        )
          throw new Error("Invalid response");
        if (active) setResult({ key: key!, data: body });
      } catch {
        if (active)
          setResult({
            key: key!,
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
  }, [course, week, end, key, attempt]);

  const current = result?.key === key ? result : null;
  const data = current?.data;
  const allGroups = data?.groups ?? [];
  const streams = [
    ...new Set(allGroups.map((group) => group.name.split("-")[0])),
  ];
  const groups = allGroups.filter(
    (group) => stream === "all" || group.name.split("-")[0] === stream,
  );
  const visibleIds = new Set(groups.map((group) => group.id));
  const intervals = data ? weekIntervals(data.days, visibleIds) : [];
  const rows: (TimeInterval | null)[] = intervals.length ? intervals : [null];
  const lessonCount =
    data?.days.reduce(
      (count, day) =>
        count +
        day.lessons.filter((lesson) =>
          lesson.groupIds.some((id) => visibleIds.has(id)),
        ).length,
      0,
    ) ?? 0;

  function retry() {
    setResult(null);
    setAttempt((value) => value + 1);
  }

  return (
    <div className="mx-auto min-w-0 max-w-[1600px] space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          Все группы
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Глобальное расписание
        </h2>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-600">
            Выберите курс
          </p>
          <div
            role="group"
            aria-label="Курс обучения"
            className="flex flex-wrap gap-2"
          >
            {[1, 2, 3, 4].map((value) => (
              <Button
                key={value}
                aria-pressed={course === value}
                variant={course === value ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => {
                  setCourse(value);
                  setStream("all");
                }}
              >
                {value} курс
              </Button>
            ))}
          </div>
        </div>
        {course !== null && (
          <div className="grid gap-2 text-sm font-medium text-gray-600">
            <span>Направление</span>
            <Select
              value={stream}
              onValueChange={setStream}
              disabled={!streams.length}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Выберите направление" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все направления</SelectItem>
                {streams.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {course === null ? (
        <Card className="rounded-2xl border-gray-200 p-12 text-center">
          <GraduationCap
            aria-hidden="true"
            className="mx-auto mb-4 size-10 text-blue-500"
          />
          <h3 className="text-lg font-semibold">Расписание вашего курса</h3>
          <p className="mt-2 text-sm text-gray-500">
            Выберите курс, чтобы увидеть группы и занятия на неделю.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
            <div>
              <h3 aria-live="polite" className="font-semibold">
                {formatDate(week, { day: "numeric", month: "short" })} —{" "}
                {formatDate(end, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {data
                  ? `Групп: ${groups.length} · Занятий: ${lessonCount}`
                  : "Выбранная неделя"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl border border-gray-200 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Предыдущая неделя"
                  onClick={() => setWeek(addDays(week, -7))}
                >
                  <ArrowLeft aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setWeek(mondayOf(today))}
                >
                  Сегодня
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Следующая неделя"
                  onClick={() => setWeek(addDays(week, 7))}
                >
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
              <DatePicker
                value={week}
                today={mondayOf(today)}
                onSelect={setWeek}
                label="Выбрать неделю"
                mondaysOnly
              />
            </div>
          </div>

          {!current ? (
            <Card role="status" className="rounded-2xl border-gray-200">
              <LoadingIndicator text="Загружаем глобальное расписание…" />
            </Card>
          ) : current.error ? (
            <ErrorState
              title={
                current.unauthorized ? "Требуется вход" : "Ошибка загрузки"
              }
              message={current.error}
              onRetry={retry}
            />
          ) : !data?.groups.length ? (
            <Card className="rounded-2xl border-gray-200 p-10 text-center">
              <h3 className="font-semibold">Расписание ещё не опубликовано</h3>
              <p className="mt-2 text-sm text-gray-500">
                Для {course} курса на эту неделю нет опубликованных занятий.
              </p>
            </Card>
          ) : (
            <Card className="min-w-0 overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
              <div
                tabIndex={0}
                role="region"
                aria-label="Глобальное расписание, прокрутка по горизонтали и вертикали"
                className="max-h-[72vh] max-w-full overflow-auto focus-visible:outline-blue-600"
              >
                <table
                  className="w-full table-fixed border-separate border-spacing-0 text-left text-xs"
                  style={{ minWidth: 208 + groups.length * 176 }}
                  aria-label={`Расписание групп ${course} курса`}
                >
                  <thead className="sticky top-0 z-30">
                    <tr>
                      <th
                        scope="col"
                        className="sticky left-0 z-40 w-28 min-w-28 border-b border-r border-gray-200 bg-gray-50 p-3"
                      >
                        День
                      </th>
                      <th
                        scope="col"
                        className="sticky left-28 z-40 w-24 min-w-24 border-b border-r border-gray-200 bg-gray-50 p-3"
                      >
                        Время
                      </th>
                      {groups.map((group) => (
                        <th
                          key={group.id}
                          scope="col"
                          className="min-w-44 border-b border-r border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-700"
                        >
                          {group.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {data.days.map((day) => (
                    <tbody key={day.date}>
                      {rows.map((interval, rowIndex) => (
                        <tr
                          key={
                            interval
                              ? `${interval.startMinutes}:${interval.endMinutes}`
                              : "empty"
                          }
                        >
                          {rowIndex === 0 && (
                            <th
                              scope="rowgroup"
                              rowSpan={rows.length}
                              className="sticky left-0 z-20 border-b border-r border-gray-200 bg-white p-3 align-top font-semibold text-gray-700"
                            >
                              {formatDate(day.date, {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </th>
                          )}
                          <th
                            scope="row"
                            className="sticky left-28 z-20 border-b border-r border-gray-200 bg-white p-3 align-top font-medium text-gray-600"
                          >
                            {interval ? (
                              <>
                                <span className="block">
                                  {minutesLabel(interval.startMinutes)}
                                </span>
                                <span className="mt-1 block text-gray-400">
                                  {minutesLabel(interval.endMinutes)}
                                </span>
                              </>
                            ) : (
                              "—"
                            )}
                          </th>
                          {globalCells(day, groups, interval).map((cell) => (
                            <td
                              key={cell.groupId}
                              colSpan={cell.span}
                              className="min-h-20 border-b border-r border-gray-200 p-2 align-top"
                            >
                              {cell.lessons.length ? (
                                <div className="space-y-2">
                                  {cell.lessons.map((lesson) => (
                                    <div
                                      key={lesson.id}
                                      className="rounded-lg border border-gray-200 border-l-4 p-3"
                                      style={
                                        subjectStyle(lesson.subject.name)
                                          .cardStyle
                                      }
                                    >
                                      <p className="font-semibold leading-5">
                                        {lesson.subject.name}
                                      </p>
                                      <p className="mt-1 text-[11px] opacity-75">
                                        {lessonTypes[lesson.type]}
                                      </p>
                                      {(lesson.teacher || lesson.classroom) && (
                                        <p className="mt-2 text-[11px] opacity-75">
                                          {[
                                            lesson.teacher,
                                            lesson.classroom &&
                                              `Ауд. ${lesson.classroom}`,
                                          ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                        </p>
                                      )}
                                      {lesson.topic && (
                                        <p className="mt-1 text-[11px] opacity-75">
                                          {lesson.topic}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : rowIndex === 0 &&
                                cell.state.status === "HOLIDAY" ? (
                                <span className="text-amber-700">
                                  {cell.state.holidays
                                    .map((holiday) => holiday.name)
                                    .join(" · ") || "Каникулы"}
                                </span>
                              ) : rowIndex === 0 &&
                                cell.state.status === "NOT_PUBLISHED" ? (
                                <span className="text-gray-400">
                                  Не опубликовано
                                </span>
                              ) : (
                                <span
                                  className="text-gray-300"
                                  aria-label="Нет занятий"
                                >
                                  —
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
              <p className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                Прокручивайте таблицу, чтобы увидеть все группы. Общие занятия
                соседних групп объединены.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
