"use client";

import { useState } from "react";
import { Calculator, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  filterSubjects,
  type Semester,
  type SemesterFilter,
  calculateOverall,
  calculateSemester,
  createSubject,
  semesterFormula,
  gradeStatus,
  initialSubjects,
  isLowGrade,
  type GradeSubject,
} from "@/lib/grades";

import SubjectCards, { SemesterFilters } from "./subject-cards";

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const formatGrade = (value: number | null) =>
  value === null
    ? "—"
    : value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

function FormulaEditor({
  subject,
  onApply,
}: {
  subject: GradeSubject;
  onApply: (formula: string) => void;
}) {
  const [draft, setDraft] = useState(subject.formula);
  const [error, setError] = useState<string>();
  const [applied, setApplied] = useState(false);
  const pending = draft !== subject.formula;

  return (
    <Card className="space-y-4 rounded-2xl border-gray-200 p-5 shadow-sm sm:p-6">
      <label className="block">
        <span className="mb-2 block text-lg font-semibold">
          Формула оценки за семестр
        </span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-gray-200 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={draft}
          maxLength={500}
          placeholder={semesterFormula}
          aria-describedby="semester-formula-help formula-status"
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(undefined);
            setApplied(false);
          }}
        />
      </label>
      <p id="semester-formula-help" className="text-xs leading-6 text-gray-500">
        {subject.stages
          .map((stage) => `${stage.variable} — ${stage.name}`)
          .join(", ")}
        . По умолчанию: 15% + 15% + 15% + 15% + 40% для первых пяти этапов.
        Чтобы учесть свой этап, добавьте его обозначение и вес в формулу. Можно
        использовать скобки, проценты и десятичные числа.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          className="rounded-lg"
          onClick={() => {
            setApplied(false);
            const formula = draft.trim() || semesterFormula;
            const validation = calculateSemester({ ...subject, formula });
            if (validation.error) {
              setError(validation.error);
              return;
            }
            onApply(formula);
            setDraft(formula);
            setApplied(true);
            setError(undefined);
          }}
        >
          Применить
        </Button>
        <Button
          variant="outline"
          className="rounded-lg"
          onClick={() => {
            setDraft(semesterFormula);
            onApply(semesterFormula);
            setError(undefined);
            setApplied(false);
          }}
        >
          Вернуть стандартную формулу
        </Button>
      </div>
      <p
        id="formula-status"
        aria-live="polite"
        className={`text-sm ${error ? "text-red-600" : "text-gray-500"}`}
      >
        {error ||
          (pending
            ? "Есть неприменённые изменения. Расчёт использует предыдущую формулу."
            : applied
              ? "Формула применена."
              : "")}
      </p>
    </Card>
  );
}

export default function GradeCalculator() {
  const [subjects, setSubjects] = useState<GradeSubject[]>(initialSubjects);
  const [selectedId, setSelectedId] = useState(initialSubjects[0].id);
  const [newSubject, setNewSubject] = useState("");
  const [semester, setSemester] = useState<SemesterFilter>("all");
  const [newSemester, setNewSemester] = useState<Semester>(1);
  const visibleSubjects = filterSubjects(subjects, semester);
  const subject =
    visibleSubjects.find((item) => item.id === selectedId) ??
    visibleSubjects[0];
  const result = subject ? calculateSemester(subject) : { value: null };
  const overall = calculateOverall(visibleSubjects);

  function updateSubject(change: Partial<GradeSubject>) {
    if (!subject) return;
    setSubjects((current) =>
      current.map((item) =>
        item.id === subject.id ? { ...item, ...change } : item,
      ),
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          Успеваемость
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Калькулятор оценок
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Выберите предмет, введите оценки за этапы и настройте формулу оценки
          за семестр.
        </p>
      </div>

      <SemesterFilters value={semester} onChange={setSemester} />
      <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Calculator
                aria-hidden="true"
                className="shrink-0 text-blue-600"
              />
              <h3 className="font-semibold text-gray-700">
                {semester === "all"
                  ? "Средний балл по всем предметам"
                  : `Средний балл · Семестр ${semester}`}
              </h3>
            </div>
            <div
              aria-live="polite"
              aria-atomic="true"
              className="flex flex-wrap items-center gap-4"
            >
              <p className="text-5xl font-bold tracking-tight">
                {formatGrade(overall.average)}
                <span className="ml-2 text-xl font-medium text-gray-400">
                  / 10
                </span>
              </p>
              <Badge
                variant="secondary"
                className="rounded-full bg-blue-100 px-3 py-1 text-blue-700"
              >
                {gradeStatus(overall.average)}
              </Badge>
            </div>
          </div>
          <div className="max-w-sm text-sm leading-6 text-gray-500">
            <p className="font-medium text-gray-700">
              Учтено предметов: {overall.countedSubjects} из{" "}
              {visibleSubjects.length}
            </p>
            <p>
              Каждый предмет имеет одинаковый вес. Учитываются рассчитанные
              оценки за семестр. Предметы без оценки не учитываются. До
              заполнения всех оценок результат предварительный.
            </p>
          </div>
        </div>
      </Card>

      <SubjectCards subjects={visibleSubjects} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="min-w-0 rounded-2xl border-gray-200 p-5 shadow-sm sm:p-6">
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold">Предмет</span>
            <select
              className={inputClass}
              value={subject?.id ?? ""}
              disabled={!subject}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {!subject && <option value="">Нет предметов</option>}
              {visibleSubjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </Card>
        <Card className="min-w-0 rounded-2xl border-gray-200 p-5 shadow-sm sm:p-6">
          <form
            className="flex min-w-0 flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!newSubject.trim()) return;
              const item = createSubject(
                crypto.randomUUID(),
                newSubject.trim(),
                newSemester,
              );
              setSubjects((current) => [...current, item]);
              setSelectedId(item.id);
              if (semester !== "all") setSemester(newSemester);
              setNewSubject("");
            }}
          >
            <label className="min-w-0 flex-1">
              <span className="mb-2 block text-sm font-semibold">
                Новый предмет
              </span>
              <input
                className={inputClass}
                placeholder="Название предмета"
                value={newSubject}
                maxLength={120}
                onChange={(event) => setNewSubject(event.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Семестр</span>
              <select
                className={inputClass}
                value={newSemester}
                onChange={(event) =>
                  setNewSemester(Number(event.target.value) as Semester)
                }
              >
                <option value={1}>Семестр 1</option>
                <option value={2}>Семестр 2</option>
              </select>
            </label>
            <Button
              type="submit"
              disabled={!newSubject.trim()}
              className="h-10 rounded-lg"
            >
              <Plus aria-hidden="true" />
              Добавить
            </Button>
          </form>
        </Card>
      </div>

      {subject && (
        <>
          <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <h3 className="mb-4 font-semibold text-gray-700">
                  Оценка за семестр
                </h3>
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className="flex flex-wrap items-center gap-4"
                >
                  <p className="text-5xl font-bold">
                    {formatGrade(result.value)}
                    <span className="ml-2 text-xl font-normal text-gray-400">
                      / 10
                    </span>
                  </p>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-blue-100 text-blue-700"
                  >
                    {gradeStatus(result.value)}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {subject.name} · Семестр {subject.semester}
              </p>
            </div>
          </Card>
          <Card className="rounded-2xl border-gray-200 p-5 shadow-sm sm:p-6">
            <h3 className="mb-5 text-lg font-semibold">Оценки за этапы</h3>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {subject.stages.map((stage) => (
                <label key={stage.variable} className="block min-w-0">
                  <span className="mb-2 block text-sm font-medium">
                    {stage.name}{" "}
                    <span className="font-mono text-xs text-blue-600">
                      {stage.variable}
                    </span>
                  </span>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    placeholder="Оценка от 1 до 10"
                    maxLength={12}
                    value={stage.grade}
                    aria-describedby="semester-feedback"
                    onChange={(event) =>
                      updateSubject({
                        stages: subject.stages.map((item) =>
                          item.variable === stage.variable
                            ? { ...item, grade: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  {isLowGrade(stage.grade) && (
                    <span className="mt-2 block text-xs text-amber-800">
                      Ниже 5 — возможна пересдача или недопуск. Уточните условия
                      у преподавателя.
                    </span>
                  )}
                </label>
              ))}
            </div>
            <form
              key={subject.id}
              className="mt-5 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const name = String(
                  new FormData(form).get("stageName") ?? "",
                ).trim();
                if (!name) return;
                const variable = `g${Math.max(...subject.stages.map((stage) => Number(stage.variable.slice(1)))) + 1}`;
                updateSubject({
                  stages: [...subject.stages, { variable, name, grade: "" }],
                });
                form.reset();
              }}
            >
              <label className="min-w-0 flex-1">
                <span className="mb-2 block text-sm font-medium">
                  Свой этап
                </span>
                <input
                  name="stageName"
                  required
                  maxLength={120}
                  className={inputClass}
                  placeholder="Например, курсовая работа"
                />
              </label>
              <Button type="submit" className="h-10 rounded-lg">
                <Plus aria-hidden="true" />
                Добавить этап
              </Button>
            </form>
          </Card>
          <p
            id="semester-feedback"
            aria-live="polite"
            className={`text-sm empty:hidden ${result.error ? "text-red-600" : "text-gray-500"}`}
          >
            {result.error ||
              (result.value === null
                ? "Заполните все оценки, используемые в формуле. Пустые поля не считаются нулями."
                : "")}
          </p>
          <FormulaEditor
            key={subject.id}
            subject={subject}
            onApply={(formula) => updateSubject({ formula })}
          />
        </>
      )}
    </div>
  );
}
