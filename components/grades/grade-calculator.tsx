"use client";

import { useState } from "react";
import { Award, BookOpen, Calculator, Info, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculateGrades, demoSubjects, type GradeSubject } from "@/lib/grades";

const inputClass = "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const formatGrade = (value: number | null) => value === null ? "—" : value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

export default function GradeCalculator() {
  const [subjects, setSubjects] = useState<GradeSubject[]>(demoSubjects);
  const stats = calculateGrades(subjects);

  function updateSubject(id: string, change: Partial<GradeSubject>) {
    setSubjects(current => current.map(subject => subject.id === id ? { ...subject, ...change } : subject));
  }

  const metrics = [
    { label: "Количество предметов", value: stats.subjectCount, note: "В текущем расчёте", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
    { label: "Лучшая оценка", value: formatGrade(stats.bestGrade), note: "По десятибалльной шкале", icon: Award, color: "bg-amber-50 text-amber-600" },
    { label: "Отличные оценки", value: stats.excellentCount, note: "Предметы с оценкой 9–10", icon: Star, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Успеваемость</p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Калькулятор оценок</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">Все оценки в одном месте. Следите за результатами и рассчитывайте средний балл.</p>
      </div>

      <Card className="overflow-hidden rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white"><Calculator aria-hidden="true" size={22} /></span>
              <h3 className="font-semibold text-gray-700">Текущий средний балл</h3>
            </div>
            <div aria-live="polite" aria-atomic="true" className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <p className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">{formatGrade(stats.average)}<span className="ml-2 text-xl font-medium text-gray-400">/ 10</span></p>
              <Badge variant="secondary" className="rounded-full border-blue-100 bg-blue-100/70 px-3 py-1 text-blue-700">{stats.status}</Badge>
            </div>
            <p className="mt-4 text-sm text-gray-500">Среднее арифметическое оценок по всем предметам</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white/80 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Info aria-hidden="true" size={17} className="text-blue-600" />Как считается балл</div>
            <p className="mt-3 text-sm leading-6 text-gray-500">Сумма всех оценок, разделённая на количество предметов.</p>
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-center text-sm font-medium text-blue-700">Сумма оценок / Количество предметов</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map(({ label, value, note, icon: Icon, color }) => (
          <Card key={label} className="rounded-2xl border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><h3 className="pt-2 text-sm font-medium text-gray-500">{label}</h3><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon aria-hidden="true" size={20} /></span></div>
            <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
            <p className="mt-2 text-xs text-gray-500">{note}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-2xl border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
          <div><h3 className="text-lg font-semibold">Предметы и оценки</h3><p className="mt-1 text-sm text-gray-500">Измените оценки — результат обновится автоматически.</p></div>
          <Button className="rounded-xl" onClick={() => setSubjects(current => [...current, { id: crypto.randomUUID(), name: "", grade: 8 }])}><Plus aria-hidden="true" />Добавить предмет</Button>
        </div>
        {subjects.length === 0 ? (
          <div className="px-6 py-12 text-center"><BookOpen aria-hidden="true" className="mx-auto mb-3 text-gray-400" /><p className="font-medium">Пока нет предметов</p><p className="mt-2 text-sm text-gray-500">Добавьте первый предмет, чтобы рассчитать средний балл.</p></div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {subjects.map((subject, index) => (
              <li key={subject.id} className="grid grid-cols-[1fr_40px] items-end gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_110px_40px] sm:gap-5 sm:px-6">
                <label className="col-span-2 min-w-0 sm:col-span-1"><span className="mb-2 block text-xs font-medium text-gray-500">Предмет {index + 1}</span><input className={inputClass} value={subject.name} placeholder="Название предмета" maxLength={120} onChange={event => updateSubject(subject.id, { name: event.target.value })} /></label>
                <label><span className="mb-2 block text-xs font-medium text-gray-500">Оценка</span><select className={inputClass} value={subject.grade} aria-label={`Оценка: ${subject.name || `предмет ${index + 1}`}`} onChange={event => updateSubject(subject.id, { grade: Number(event.target.value) })}>{Array.from({ length: 10 }, (_, i) => i + 1).map(grade => <option key={grade} value={grade}>{grade}</option>)}</select></label>
                <Button variant="ghost" size="icon" className="size-10 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Удалить ${subject.name || `предмет ${index + 1}`}`} onClick={() => setSubjects(current => current.filter(item => item.id !== subject.id))}><Trash2 aria-hidden="true" /></Button>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4 text-xs leading-5 text-gray-500">Шкала калькулятора: 9–10 — отлично, 7–8,99 — хорошо, 5–6,99 — удовлетворительно, ниже 5 — нужно подтянуть. Статус определяется до округления среднего балла.</div>
      </Card>
      <p className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-5 text-gray-500"><Info aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-blue-600" />Демонстрационные данные. Вы можете менять их для расчёта; изменения сохраняются только до ухода со страницы или её перезагрузки. Данные университета пока не подключены.</p>
    </div>
  );
}

