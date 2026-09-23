"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "./schedule-fields";
import type {
  SubjectChoice,
  SubjectMatchPreview,
} from "@/lib/subject-matching";

export default function ScheduleSubjectMatching({
  preview,
  busy,
  error,
  onConfirm,
  onBack,
}: {
  preview: SubjectMatchPreview;
  busy: boolean;
  error: string;
  onConfirm: (choices: SubjectChoice[]) => void;
  onBack: () => void;
}) {
  const [choices, setChoices] = useState(() =>
    preview.subjects.map((s) =>
      s.exactIds.length === 1
        ? s.exactIds[0]
        : s.exactIds.length || s.suggestedIds.length
          ? ""
          : "new",
    ),
  );
  const [search, setSearch] = useState("");
  const remaining = choices.filter((c) => !c).length;
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!remaining)
          onConfirm(
            preview.subjects.map((s, i) => ({
              sourceName: s.sourceName,
              subjectId: choices[i] === "new" ? null : choices[i],
            })),
          );
      }}
    >
      <p className="text-sm text-gray-600">
        Найдено занятий: {preview.lessonCount}. Предметов:{" "}
        {preview.subjects.length}. Проверьте соответствия. Похожие названия
        требуют вашего выбора. Архивные дисциплины останутся в архиве.
      </p>
      <input
        className={fieldClass}
        aria-label="Поиск названия из PDF"
        placeholder="Найти название из PDF"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <fieldset disabled={busy} className="space-y-3">
        {preview.subjects.map((row, index) => {
          const preferred = new Set([...row.exactIds, ...row.suggestedIds]);
          const options = [
            ...preview.catalog.filter((s) => preferred.has(s.id)),
            ...preview.catalog.filter((s) => !preferred.has(s.id)),
          ];
          return (
            <div
              key={row.sourceName}
              hidden={
                !row.sourceName
                  .toLocaleLowerCase()
                  .includes(search.toLocaleLowerCase())
              }
              className="space-y-2 rounded-lg border border-gray-200 p-3"
            >
              <p className="break-words text-sm">
                В PDF: <strong>{row.sourceName}</strong>
              </p>
              <label
                className="block text-sm"
                htmlFor={`subject-match-${index}`}
              >
                Дисциплина в справочнике
              </label>
              <select
                id={`subject-match-${index}`}
                className={`${fieldClass} w-full min-w-0`}
                value={choices[index]}
                onChange={(e) =>
                  setChoices((all) =>
                    all.map((v, i) => (i === index ? e.target.value : v)),
                  )
                }
              >
                <option value="">Выберите соответствие</option>
                {row.exactIds.length === 0 && (
                  <option value="new">Создать новую: {row.sourceName}</option>
                )}
                {options.map((s) => (
                  <option key={s.id} value={s.id}>
                    {preferred.has(s.id) ? "★ " : ""}
                    {s.name}
                    {s.code ? ` · ${s.code}` : ""}
                    {s.status === "ARCHIVED" ? " · Архив" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                {row.exactIds.length > 1
                  ? "Несколько совпадений — выберите дисциплину."
                  : row.exactIds.length === 1
                    ? "Совпадает название (без учёта регистра и пробелов)."
                    : row.suggestedIds.length
                      ? "★ Похожие названия — проверьте, что это один предмет."
                      : "Совпадений не найдено. Можно выбрать дисциплину вручную."}
              </p>
            </div>
          );
        })}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {remaining > 0 && (
        <p role="status" className="text-sm text-amber-700">
          Осталось сопоставить: {remaining}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onBack}
        >
          Назад к файлу
        </Button>
        <Button
          type="submit"
          disabled={busy || remaining > 0 || !preview.lessonCount}
        >
          {busy ? "Создаём черновик…" : "Подтвердить и создать черновик"}
        </Button>
      </div>
    </form>
  );
}
