"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import WeekGrid from "./week-grid";
import { addDays, mondayOf, universityToday, weekLabel } from "@/lib/schedule";
import { assessmentKinds, getDemoAssessments, type AssessmentKind } from "@/lib/assessments";

export default function Assessments({ initialToday }: { initialToday: string }) {
  const [kind, setKind] = useState<AssessmentKind>("Аттестация 1");
  const [week, setWeek] = useState(mondayOf(initialToday));
  const [today, setToday] = useState(initialToday);
  const lessons = getDemoAssessments(week, kind);
  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Проверка знаний</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Аттестации и экзамены</h2></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Вид аттестации">{assessmentKinds.map(value => <Button key={value} aria-pressed={kind === value} variant={kind === value ? "default" : "outline"} onClick={() => setKind(value)} className="rounded-xl">{value}</Button>)}</div>
      <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
          <div><h3 aria-live="polite" aria-atomic="true" className="text-lg font-semibold">{weekLabel(week)}</h3><p aria-live="polite" className="mt-1 text-sm text-gray-500">{kind} · Событий: {lessons.length}</p></div>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1">
            <Button variant="ghost" size="icon" aria-label="Предыдущая неделя" onClick={() => setWeek(value => addDays(value, -7))}><ArrowLeft /></Button>
            <Button variant="ghost" onClick={() => { const date = universityToday(); setToday(date); setWeek(mondayOf(date)); }}>Сегодня</Button>
            <Button variant="ghost" size="icon" aria-label="Следующая неделя" onClick={() => setWeek(value => addDays(value, 7))}><ArrowRight /></Button>
          </div>
        </div>
        <WeekGrid days={Array.from({ length: 5 }, (_, day) => addDays(week, day))} lessons={lessons} today={today} />
      </Card>
      <p className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-5 text-gray-500">Демонстрационное расписание. Даты аттестаций и экзаменов будут доступны после подключения данных университета.</p>
    </div>
  );
}
