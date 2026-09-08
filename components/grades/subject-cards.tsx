"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeStatus, subjectGrade, type GradeSubject, type SemesterFilter } from "@/lib/grades";

export function SemesterFilters({ value, onChange }: { value: SemesterFilter; onChange: (value: SemesterFilter) => void }) {
  return <div role="group" aria-label="Фильтр по семестру" className="flex flex-wrap gap-2">
    {(["all", 1, 2] as const).map(semester => <Button key={semester} variant={value === semester ? "default" : "outline"} aria-pressed={value === semester} className="rounded-xl" onClick={() => onChange(semester)}>{semester === "all" ? "Все семестры" : `Семестр ${semester}`}</Button>)}
  </div>;
}

export default function SubjectCards({ subjects, selectedId, onSelect }: {
  subjects: GradeSubject[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (!subjects.length) return <Card className="rounded-2xl p-6 text-sm text-gray-500">В этом семестре пока нет предметов.</Card>;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {subjects.map(subject => {
      const grade = subjectGrade(subject);
      const color = grade === null ? "bg-gray-100 text-gray-600" : grade < 5 ? "bg-amber-100 text-amber-900" : grade >= 9 ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700";
      return <Card key={subject.id} className={`min-w-0 space-y-4 rounded-2xl p-5 shadow-sm ${selectedId === subject.id ? "border-blue-400 ring-1 ring-blue-100" : "border-gray-200"}`}>
        <div><h3 className="break-words font-semibold">{subject.name}</h3><p className="mt-1 text-xs text-gray-500">Семестр {subject.semester}</p></div>
        <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-2"><p className="text-2xl font-bold tabular-nums">{grade === null ? "—" : grade.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}<span className="text-sm font-normal text-gray-400"> / 10</span></p><Badge variant="secondary" className={color}>{gradeStatus(grade)}</Badge></div>
        <div role="progressbar" aria-label={`Оценка по предмету ${subject.name}`} aria-valuemin={0} aria-valuemax={10} aria-valuenow={grade ?? 0} aria-valuetext={grade === null ? "Нет оценки" : `${grade.toLocaleString("ru-RU")} из 10`} className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${grade !== null && grade < 5 ? "bg-amber-500" : grade !== null && grade >= 9 ? "bg-emerald-500" : "bg-blue-600"}`} style={{ width: `${(grade ?? 0) * 10}%` }} /></div>
        {subject.gradeOverride != null && <p className="text-xs leading-5 text-gray-500">Итоговая оценка задана вручную.</p>}
        {grade !== null && grade < 5 && <p className="text-xs leading-5 text-amber-800">Возможна пересдача или недопуск к экзамену.</p>}
        <Button variant={selectedId === subject.id ? "secondary" : "outline"} aria-pressed={selectedId === subject.id} className="w-full rounded-lg" onClick={() => onSelect(subject.id)}>{selectedId === subject.id ? "Предмет выбран" : "Открыть этапы"}</Button>
      </Card>;
    })}
  </div>;
}
