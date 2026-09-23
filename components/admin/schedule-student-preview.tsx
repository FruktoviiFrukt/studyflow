import { useState } from "react";
import {
  DAYS,
  SLOTS,
  holidayOn,
  lessonOnDate,
  type ScheduleHoliday,
  type AdminLesson,
} from "@/lib/admin-schedule";
import {
  addDays,
  mondayOf,
  universityToday,
  formatDate,
  weekLabel,
} from "@/lib/schedule";
import DatePicker from "@/components/schedule/date-picker";

function slotLabel(slot: string) {
  const exact = SLOTS.indexOf(slot);
  if (exact >= 0) return `${exact + 1} пара`;
  const [start, end] = slot.split("–");
  const first = SLOTS.findIndex((item) => item.startsWith(`${start}–`));
  const last = SLOTS.findIndex((item) => item.endsWith(`–${end}`));
  return first >= 0 && last > first
    ? `${first + 1}–${last + 1} пары`
    : "Другое время";
}

export default function ScheduleStudentPreview({
  lessons,
  day,
  editable,
  issueIds,
  onEdit,
  holidays,
}: {
  lessons: AdminLesson[];
  day: string;
  editable: boolean;
  issueIds: Set<string>;
  onEdit: (lesson: AdminLesson) => void;
  holidays: ScheduleHoliday[];
}) {
  const [date, setDate] = useState(
    () =>
      lessons
        .map((lesson) => lesson.date)
        .filter((value): value is string => !!value)
        .sort()[0] || universityToday(),
  );
  const datedOnly =
    lessons.length > 0 && lessons.every((lesson) => lesson.parity === "once");
  const firstDate = lessons
    .map((lesson) => lesson.date)
    .filter((value): value is string => !!value)
    .sort()[0];
  const week = mondayOf(date);
  const hasDatedLessonsThisWeek = lessons.some(
    (lesson) =>
      lesson.date && lesson.date >= week && lesson.date <= addDays(week, 6),
  );
  const days =
    day === ""
      ? [
          0,
          1,
          2,
          3,
          4,
          ...[5, 6].filter(
            (d) =>
              lessons.some((l) => l.day === d) ||
              holidayOn(addDays(week, d), holidays),
          ),
        ]
      : [Number(day)];
  // Keep all seven university slots visible and retain any manually entered interval.
  const slots = [
    ...new Set([...SLOTS, ...lessons.map((l) => `${l.start}–${l.end}`)]),
  ].sort();
  return (
    <>
      <div className="flex flex-wrap items-end gap-4 border-b border-gray-100 p-5">
        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-gray-700">
            Дата предпросмотра
          </span>
          <DatePicker
            label="Дата предпросмотра"
            showValue
            value={date}
            today={universityToday()}
            onSelect={setDate}
          />
        </div>
        <p className="pb-2 text-sm text-gray-500">
          {weekLabel(week)} ·{" "}
          {datedOnly
            ? "аттестации показаны по датам из PDF"
            : "чётность задаётся фильтром «Чётность»"}
        </p>
      </div>
      {datedOnly && firstDate && !hasDatedLessonsThisWeek && (
        <div
          role="status"
          className="border-b border-gray-100 bg-blue-50 p-5 text-sm text-blue-950"
        >
          <p>
            На выбранную неделю у этой группы нет аттестаций. Первая аттестация
            —{" "}
            {formatDate(firstDate, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
          <button
            type="button"
            className="mt-2 font-medium underline underline-offset-4"
            onClick={() => setDate(firstDate)}
          >
            Перейти к первой аттестации
          </button>
        </div>
      )}
      <div
        className="overflow-x-auto"
        role="region"
        aria-label="Предпросмотр расписания студента"
        tabIndex={0}
      >
        <table
          className="w-full table-fixed border-collapse text-left"
          style={{ minWidth: days.length > 1 ? 100 + days.length * 175 : 300 }}
        >
          <thead>
            <tr className="bg-gray-50">
              <th
                scope="col"
                className="w-[100px] p-3 text-xs font-medium text-gray-500"
              >
                Время
              </th>
              {days.map((d) => (
                <th
                  key={d}
                  scope="col"
                  className="border-l border-gray-100 p-3 text-sm font-semibold"
                >
                  {DAYS[d]}
                  <span className="mt-1 block text-xs font-normal text-gray-500">
                    {formatDate(addDays(week, d), {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  {holidayOn(addDays(week, d), holidays) && (
                    <span className="mt-2 block rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-800">
                      {holidayOn(addDays(week, d), holidays)!.name} · занятий
                      нет
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="border-t border-gray-100">
                <th
                  scope="row"
                  className="p-3 align-top text-xs font-normal text-gray-500"
                >
                  <span className="block font-semibold text-gray-700">
                    {slot.split("–")[0]}
                  </span>
                  <span className="mt-1 block">{slot.split("–")[1]}</span>
                  <span className="mt-2 block text-[10px]">
                    {slotLabel(slot)}
                  </span>
                </th>
                {days.map((d) => {
                  const matches = lessons.filter(
                    (l) =>
                      !holidayOn(addDays(week, d), holidays) &&
                      lessonOnDate(l, addDays(week, d), d) &&
                      `${l.start}–${l.end}` === slot,
                  );
                  return (
                    <td
                      key={d}
                      className="h-24 border-l border-gray-100 p-2 align-top"
                    >
                      {matches.length ? (
                        <div className="space-y-2">
                          {matches.map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              disabled={!editable}
                              onClick={() => onEdit(l)}
                              className="w-full rounded-xl border-l-4 border-blue-500 bg-blue-50 p-3 text-left transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-default"
                            >
                              <p className="text-xs font-semibold text-blue-600">
                                {l.start}–{l.end}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-blue-950 [overflow-wrap:anywhere]">
                                {l.subject}
                              </p>
                              <p className="mt-1 text-xs text-blue-800">
                                {l.type}
                              </p>
                              <p className="mt-3 text-xs text-blue-800">
                                Ауд. {l.room || "не указана"}
                              </p>
                              <p className="mt-1 text-xs text-blue-700">
                                {l.teacher || "Преподаватель не указан"}
                              </p>
                              {issueIds.has(l.id) && (
                                <p className="mt-2 text-xs font-semibold text-amber-800">
                                  Нужно проверить
                                </p>
                              )}
                            </button>
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
    </>
  );
}
