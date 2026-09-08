"use client";

import { useState } from "react";
import { AlertTriangle, Calculator, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { filterSubjects, subjectGrade, type SemesterFilter, calculateOverall, calculateStage, defaultFormula, gradeStatus, isLowGrade, type GradeSubject } from "@/lib/grades";

import SubjectCards, { SemesterFilters } from "./subject-cards";

const formatGrade = (value: number | null) => value === null ? "—" : value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

function AverageCard({ title, value, children }: { title: string; value: number | null; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="mb-4 flex items-center gap-3"><Calculator aria-hidden="true" className="shrink-0 text-blue-600" /><h3 className="font-semibold text-gray-700">{title}</h3></div>
          <div aria-live="polite" aria-atomic="true" className="flex flex-wrap items-center gap-4">
            <p className="text-5xl font-bold tracking-tight">{formatGrade(value)}<span className="ml-2 text-xl font-medium text-gray-400">/ 10</span></p>
            <Badge variant="secondary" className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">{gradeStatus(value)}</Badge>
          </div>
        </div>
        <div className="max-w-sm text-sm leading-6 text-gray-500">{children}</div>
      </div>
    </Card>
  );
}

// This view accepts teacher records separately from the calculator's local edits.
export default function TeacherGrades({ subjects }: { subjects: GradeSubject[] }) {
  const [selectedId, setSelectedId] = useState(subjects[0]?.id ?? "");
  const [semester, setSemester] = useState<SemesterFilter>("all");
  const visibleSubjects = filterSubjects(subjects, semester);
  const subject = visibleSubjects.find(item => item.id === selectedId) ?? visibleSubjects[0];
  const overall = calculateOverall(visibleSubjects);
  const results = subject?.stages.map(stage => ({ stage, ...calculateStage(stage) })) ?? [];
  const completed = results.filter(result => result.value !== null);
  const average = subject ? subjectGrade(subject) : null;
  const risks = results.flatMap(({ stage, value }) => [
    ...(value !== null && value < 5 ? [stage.name] : []),
    ...stage.parts.filter(part => isLowGrade(part.grade)).map(part => `${stage.name}: ${part.name || part.variable}`),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Успеваемость</p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Оценки от преподавателей</h2>
        <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-gray-500"><LockKeyhole aria-hidden="true" className="mt-1 size-4 shrink-0" />Только просмотр. Предметы, этапы, оценки и формулы заполняет преподаватель.</p>
      </div>

      <SemesterFilters value={semester} onChange={setSemester} />
      <AverageCard title={semester === "all" ? "Средний балл по всем предметам" : `Средний балл · Семестр ${semester}`} value={overall.average}>
        <p className="font-medium text-gray-700">Учтено предметов: {overall.countedSubjects} из {visibleSubjects.length}</p>
        <p>Каждый предмет имеет одинаковый вес. Предметы без рассчитанных этапов не учитываются. До выставления всех оценок результат предварительный.</p>
      </AverageCard>

      <SubjectCards subjects={visibleSubjects} selectedId={subject?.id} onSelect={setSelectedId} />
      {!subject ? <Card className="rounded-2xl p-6 text-sm text-gray-500">Выберите другой семестр, чтобы посмотреть оценки.</Card> : <>
        <Card className="rounded-2xl border-gray-200 p-5 shadow-sm sm:p-6">
          <label className="block"><span className="mb-2 block text-sm font-semibold">Предмет</span>
            <select className="h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" value={subject.id} onChange={event => setSelectedId(event.target.value)}>
              {visibleSubjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </Card>
        <AverageCard title="Средний балл по предмету" value={average}>
          <p className="font-medium text-gray-700">{subject.name} · Семестр {subject.semester}</p><p>Рассчитано этапов: {completed.length} из {results.length}</p>
          <p>{subject.gradeOverride != null ? "Итоговая оценка выставлена преподавателем." : "Среднее результатов рассчитанных этапов. До выставления всех оценок результат предварительный."}</p>
        </AverageCard>

        {risks.length > 0 && <div role="alert" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0"><p className="font-semibold">Возможна пересдача или недопуск к экзамену</p><p className="mt-1 break-words leading-6">Есть оценки ниже 5: {risks.join(", ")}. Уточните условия у преподавателя.</p></div>
        </div>}

        <h3 className="text-lg font-semibold">Аттестации и другие этапы</h3>
        {results.length === 0 && <Card className="rounded-2xl p-6 text-sm text-gray-500">Преподаватель пока не добавил этапы.</Card>}
        {results.map(({ stage, value, error }) => (
          <Card key={stage.id} className="overflow-hidden rounded-2xl border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50 p-5 sm:p-6">
              <h4 className="min-w-0 break-words font-semibold">{stage.name}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">Результат:<Badge variant="secondary" className={value !== null && value < 5 ? "bg-amber-100 text-amber-900" : "bg-blue-50 text-blue-700"}>{formatGrade(value)}</Badge></div>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <dl className="divide-y divide-gray-100">
                {stage.parts.map(part => <div key={part.id} className="py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="min-w-0 break-words text-sm text-gray-700"><span className="mr-2 font-mono text-xs text-blue-600">{part.variable}</span>{part.name || "Без названия"}</dt>
                    <dd className={`shrink-0 text-sm font-semibold ${isLowGrade(part.grade) ? "text-amber-800" : "text-gray-900"}`}>{part.grade.trim() || "Не выставлена"}</dd>
                  </div>
                  {isLowGrade(part.grade) && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">Оценка ниже 5 — возможна пересдача или недопуск к экзамену, даже если итог этапа выше 5.</p>}
                </div>)}
              </dl>
              {stage.parts.length === 0 && <p className="text-sm text-gray-500">Подпункты пока не добавлены.</p>}
              <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <p className="text-sm font-semibold">Формула расчёта</p>
                <p className="break-words font-mono text-sm text-blue-700">{stage.formula.trim() || defaultFormula(stage.parts) || "—"}</p>
                <p className={`text-sm ${error ? "text-red-600" : value !== null && value < 5 ? "text-amber-800" : "text-gray-500"}`}>
                  {error ? "Не удалось рассчитать результат. Обратитесь к преподавателю." : value === null ? "Ожидаются оценки преподавателя." : value < 5 ? "Результат ниже 5 — возможна пересдача или недопуск к экзамену." : `Результат: ${formatGrade(value)} · ${gradeStatus(value)}`}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </>}
    </div>
  );
}
