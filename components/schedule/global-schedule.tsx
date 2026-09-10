"use client";

import { useState } from "react";
import { BookOpen, ExternalLink, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  globalRow,
  globalTimeSlots,
  groupsForYear,
} from "@/lib/global-schedule";
import { weekdays } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export default function GlobalSchedule() {
  const [year, setYear] = useState<number | null>(null);
  const [stream, setStream] = useState("all");
  const allGroups = year ? groupsForYear(year) : [];
  const streams = [...new Set(allGroups.map((group) => group.split("-")[0]))];
  const groups = allGroups.filter(
    (group) => stream === "all" || group.startsWith(`${stream}-`),
  );
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
                aria-pressed={year === value}
                variant={year === value ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => {
                  setYear(value);
                  setStream("all");
                }}
              >
                {value} курс
              </Button>
            ))}
          </div>
        </div>
        {year && (
          <label className="grid gap-2 text-sm font-medium text-gray-600">
            Направление
            <select
              value={stream}
              onChange={(event) => setStream(event.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-blue-600"
            >
              <option value="all">Все направления</option>
              {streams.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!year ? (
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
          <Card className="min-w-0 overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4 sm:p-5">
              <div>
                <h3 aria-live="polite" className="font-semibold">
                  {year} курс · Все занятия
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Групп: {groups.length} · Понедельник — пятница ·
                  Демо-расписание
                </p>
              </div>
              <BookOpen aria-hidden="true" className="size-5 text-blue-600" />
            </div>
            <div
              tabIndex={0}
              role="region"
              aria-label="Общее расписание групп, прокрутка по горизонтали и вертикали"
              className="max-h-[72vh] max-w-full overflow-auto focus-visible:outline-blue-600"
            >
              <table
                className="w-full table-fixed border-separate border-spacing-0 text-left text-xs"
                style={{ minWidth: 208 + groups.length * 176 }}
                aria-label={`Расписание всех групп ${year} курса`}
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
                        key={group}
                        scope="col"
                        className="min-w-44 border-b border-r border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-700"
                      >
                        {group}
                      </th>
                    ))}
                  </tr>
                </thead>
                {weekdays.map((day, dayIndex) => (
                  <tbody key={day}>
                    {globalTimeSlots.map((slot, slotIndex) => (
                      <tr key={slot.start}>
                        {slotIndex === 0 && (
                          <th
                            scope="rowgroup"
                            rowSpan={globalTimeSlots.length}
                            className="sticky left-0 z-20 border-b border-r border-gray-200 bg-white p-3 align-top font-semibold text-gray-700"
                          >
                            <span className="sticky top-16 block pt-2">
                              {day}
                            </span>
                          </th>
                        )}
                        <th
                          scope="row"
                          className="sticky left-28 z-20 border-b border-r border-gray-200 bg-white p-3 align-top font-medium text-gray-600"
                        >
                          <span className="block">{slot.start}</span>
                          <span className="mt-1 block text-gray-400">
                            {slot.end}
                          </span>
                        </th>
                        {globalRow(year, groups, dayIndex, slotIndex).map(
                          (cell) => (
                            <td
                              key={cell.group}
                              colSpan={cell.span}
                              className="h-28 border-b border-r border-gray-200 p-2 align-top"
                            >
                              {cell.subject ? (
                                <div
                                  className={cn(
                                    "h-full rounded-lg border p-3",
                                    cell.color,
                                  )}
                                >
                                  <p className="font-semibold leading-5">
                                    {cell.subject}
                                  </p>
                                  <p className="mt-1 text-[11px] opacity-75">
                                    {cell.type}
                                  </p>
                                  <p className="mt-2 text-[11px] opacity-75">
                                    Ауд. {cell.classroom}
                                  </p>
                                </div>
                              ) : (
                                <span
                                  className="text-gray-300"
                                  aria-label="Нет занятий"
                                >
                                  —
                                </span>
                              )}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
            <p className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              Прокручивайте таблицу, чтобы увидеть все группы. Общие лекции
              объединены по потоку.
            </p>
          </Card>
          <p className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-5 text-gray-500">
            Структура таблицы и названия групп III курса взяты из образца.
            Занятия и данные остальных курсов — демонстрационные.
          </p>
          {year === 3 && (
            <a
              href="/schedules/year-3-semester-5.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-blue-600 hover:underline focus-visible:outline-blue-600"
            >
              Открыть исходное расписание III курса (PDF)
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          )}
        </>
      )}
    </div>
  );
}
