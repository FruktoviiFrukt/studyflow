"use client";

import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ScheduleHoliday } from "@/lib/admin-schedule";
import { formatDate, universityToday } from "@/lib/schedule";
import { Field, fieldClass } from "./schedule-fields";

import DatePicker from "@/components/schedule/date-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function ScheduleHolidays({
  holidays,
  editable,
  onChange,
}: {
  holidays: ScheduleHoliday[];
  editable: boolean;
  onChange: (holidays: ScheduleHoliday[]) => void;
}) {
  const [editing, setEditing] = useState<ScheduleHoliday | null>(null);
  const [mode, setMode] = useState("day");
  const [error, setError] = useState("");
  function open(holiday: ScheduleHoliday) {
    setEditing(holiday);
    setMode(holiday.start === holiday.end ? "day" : "range");
    setError("");
  }
  const label = (date: string) =>
    formatDate(date, { day: "numeric", month: "long", year: "numeric" });
  return (
    <section
      aria-label="Каникулы и выходные"
      className="border-b border-gray-200 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="size-4 text-blue-600" />
            Каникулы и выходные
          </h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Для всех групп и подгрупп этого расписания. В указанные даты занятий
            нет; чётность недель сохраняется.
          </p>
        </div>
        {editable && (
          <Button
            variant="outline"
            className="rounded-lg shadow-none"
            onClick={() => open({ id: "", name: "", start: "", end: "" })}
          >
            <Plus />
            Добавить каникулы
          </Button>
        )}
      </div>
      {holidays.length ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[...holidays]
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((holiday) => (
              <li
                key={holiday.id}
                className="rounded-xl border border-amber-100 bg-amber-50/60 p-4"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {holiday.name}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {label(holiday.start)}
                  {holiday.start !== holiday.end &&
                    ` — ${label(holiday.end)}`}{" "}
                  · включительно
                </p>
                {editable && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Изменить каникулы ${holiday.name}`}
                      onClick={() => open(holiday)}
                    >
                      Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-700"
                      aria-label={`Удалить каникулы ${holiday.name}`}
                      onClick={() =>
                        onChange(holidays.filter((h) => h.id !== holiday.id))
                      }
                    >
                      Удалить
                    </Button>
                  </div>
                )}
              </li>
            ))}
        </ul>
      ) : null}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Изменить каникулы" : "Добавить каникулы"}
            </DialogTitle>
            <DialogDescription>
              Выберите один день или период без занятий для текущего расписания.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const end = mode === "day" ? editing.start : editing.end;
                if (
                  !editing.name.trim() ||
                  !editing.start ||
                  !end ||
                  end < editing.start
                ) {
                  setError(
                    "Укажите название и даты. Окончание не может быть раньше начала.",
                  );
                  return;
                }
                const next = {
                  ...editing,
                  name: editing.name.trim(),
                  end,
                  id: editing.id || crypto.randomUUID(),
                };
                onChange(
                  editing.id
                    ? holidays.map((h) => (h.id === editing.id ? next : h))
                    : [...holidays, next],
                );
                setEditing(null);
              }}
            >
              <Field label="Название">
                <input
                  required
                  maxLength={100}
                  className={fieldClass}
                  placeholder="Например, зимние каникулы"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </Field>
              <div className="grid gap-1.5">
                <span className="text-sm font-medium text-gray-700">
                  Продолжительность
                </span>
                <Select
                  value={mode}
                  onValueChange={(value) => {
                    setMode(value);
                    setError("");
                  }}
                >
                  <SelectTrigger
                    aria-label="Продолжительность"
                    className="w-full rounded-lg border-gray-300 bg-white px-4 py-2.5 data-[size=default]:h-auto"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="day">Один день</SelectItem>
                    <SelectItem value="range">Промежуток дат</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <span className="text-sm font-medium text-gray-700">
                    {mode === "day" ? "Дата выходного" : "Начало каникул"}
                  </span>
                  <DatePicker
                    label={mode === "day" ? "Дата выходного" : "Начало каникул"}
                    showValue
                    value={editing.start}
                    today={universityToday()}
                    onSelect={(start) => {
                      setEditing({
                        ...editing,
                        start,
                        end:
                          editing.end && editing.end < start ? "" : editing.end,
                      });
                      setError("");
                    }}
                  />
                </div>
                {mode === "range" && (
                  <div className="grid gap-1.5">
                    <span className="text-sm font-medium text-gray-700">
                      Окончание каникул
                    </span>
                    <DatePicker
                      label="Окончание каникул"
                      showValue
                      value={editing.end}
                      min={editing.start || undefined}
                      today={universityToday()}
                      onSelect={(end) => {
                        setEditing({ ...editing, end });
                        setError("");
                      }}
                    />
                  </div>
                )}
              </div>
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Отмена
                </Button>
                <Button type="submit">Сохранить каникулы</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
