"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DAYS,
  PARITIES,
  SLOTS,
  TYPES,
  lessonErrors,
  type AdminLesson,
  type Audience,
  type Parity,
} from "@/lib/admin-schedule";
import { Field, SelectField, fieldClass } from "./schedule-fields";

export default function ScheduleLessonEditor({
  lesson,
  onClose,
  onSave,
}: {
  lesson: AdminLesson;
  onClose: () => void;
  onSave: (lesson: AdminLesson) => void;
}) {
  const [form, setForm] = useState<AdminLesson>(() => structuredClone(lesson));
  const [errors, setErrors] = useState<string[]>([]);
  function change<K extends keyof AdminLesson>(key: K, value: AdminLesson[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function recipient(index: number, patch: Partial<Audience>) {
    change(
      "audiences",
      form.audiences.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    );
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const clean = {
      ...form,
      subject: form.subject.trim(),
      teacher: form.teacher.trim(),
      room: form.room.trim(),
      topic: form.topic.trim(),
      audiences: form.audiences.map((a) => ({
        ...a,
        group: a.group.trim().toUpperCase(),
      })),
    };
    const nextErrors = lessonErrors(clean);
    setErrors(nextErrors);
    if (!nextErrors.length) onSave(clean);
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {lesson.id ? "Редактировать занятие" : "Новое занятие"}
          </DialogTitle>
          <DialogDescription>
            Укажите данные из расписания. Общая лекция может относиться к
            нескольким группам.
          </DialogDescription>
        </DialogHeader>
        {lesson.sourceText && (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-blue-50 p-3 text-xs text-blue-950">
            {lesson.sourceText}
          </pre>
        )}
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Предмет *">
              <input
                required
                maxLength={160}
                className={fieldClass}
                value={form.subject}
                onChange={(e) => change("subject", e.target.value)}
                placeholder="Например, Математический анализ"
              />
            </Field>
            <SelectField
              label="Тип занятия"
              value={form.type}
              onChange={(e) => change("type", e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </SelectField>
            <SelectField
              label="День недели"
              value={form.day}
              onChange={(e) => change("day", Number(e.target.value))}
            >
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Повторение"
              value={form.parity}
              onChange={(e) => change("parity", e.target.value as Parity)}
            >
              {Object.entries(PARITIES).map(([id, text]) => (
                <option key={id} value={id}>
                  {text}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Быстрый выбор пары"
              value={
                SLOTS.includes(`${form.start}–${form.end}`)
                  ? `${form.start}–${form.end}`
                  : "custom"
              }
              onChange={(e) => {
                if (e.target.value !== "custom") {
                  const [start, end] = e.target.value.split("–");
                  setForm((f) => ({ ...f, start, end }));
                }
              }}
            >
              <option value="custom">Другое время</option>
              {SLOTS.map((s, i) => (
                <option key={s} value={s}>
                  {i + 1} пара · {s}
                </option>
              ))}
            </SelectField>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Начало *">
                <input
                  className={fieldClass}
                  type="time"
                  required
                  value={form.start}
                  onChange={(e) => change("start", e.target.value)}
                />
              </Field>
              <Field label="Окончание *">
                <input
                  className={fieldClass}
                  type="time"
                  required
                  value={form.end}
                  onChange={(e) => change("end", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Преподаватель">
              <input
                maxLength={120}
                className={fieldClass}
                value={form.teacher}
                onChange={(e) => change("teacher", e.target.value)}
                placeholder="Как указан в PDF"
              />
            </Field>
            <Field label="Аудитория">
              <input
                maxLength={60}
                className={fieldClass}
                value={form.room}
                onChange={(e) => change("room", e.target.value)}
                placeholder="Например, 6-2 или D01"
              />
            </Field>
          </div>
          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-1 text-sm font-semibold">
              Для кого проводится занятие
            </legend>
            <div className="space-y-3">
              {form.audiences.map((a, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                    <Field label={`Группа ${index + 1} *`}>
                      <input
                        required
                        maxLength={30}
                        className={fieldClass}
                        value={a.group}
                        onChange={(e) =>
                          recipient(index, { group: e.target.value })
                        }
                        placeholder="SI-261"
                      />
                    </Field>
                    <SelectField
                      label={`Получатели ${index + 1}`}
                      value={a.subgroup}
                      onChange={(e) =>
                        recipient(index, {
                          subgroup: e.target.value as Audience["subgroup"],
                        })
                      }
                    >
                      <option value="all">Вся группа</option>
                      <option value="1">Подгруппа 1</option>
                      <option value="2">Подгруппа 2</option>
                    </SelectField>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={form.audiences.length === 1}
                    aria-label={`Убрать группу ${index + 1}`}
                    onClick={() =>
                      change(
                        "audiences",
                        form.audiences.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              className="mt-3"
              type="button"
              variant="ghost"
              onClick={() =>
                change("audiences", [
                  ...form.audiences,
                  { group: "", subgroup: "all" },
                ])
              }
            >
              <Plus />
              Ещё группа
            </Button>
          </fieldset>
          <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            В PDF сверху — нечётная неделя, снизу — чётная. Если у подгрупп
            разные преподаватели или аудитории, создайте отдельные занятия.
          </p>
          <Field label="Тема занятия · необязательно">
            <textarea
              maxLength={500}
              rows={2}
              className={fieldClass}
              value={form.topic}
              onChange={(e) => change("topic", e.target.value)}
            />
          </Field>
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              className="mt-1 size-4 accent-blue-600"
              type="checkbox"
              checked={form.reviewed}
              onChange={(e) => change("reviewed", e.target.checked)}
            />
            <span>
              Данные, группы и подгруппы проверены
              <span className="mt-1 block text-xs text-gray-500">
                Непроверенные занятия можно сохранить в черновик, но нельзя
                опубликовать.
              </span>
            </span>
          </label>
          {errors.length > 0 && (
            <ul
              role="alert"
              className="space-y-1 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Сохранить в черновик</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
