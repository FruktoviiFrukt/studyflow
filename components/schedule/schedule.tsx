"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Info, MousePointer2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LessonCard from "./lesson-card";
import WeekGrid from "./week-grid";
import DatePicker from "./date-picker";
import { addDays, formatDate, getDemoLessons, mondayOf, subjects, universityToday, weekLabel } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export default function Schedule({ initialToday }: { initialToday: string }) {
  const [today, setToday] = useState(initialToday);
  const [selectedDay, setSelectedDay] = useState(initialToday);
  const [view, setView] = useState<"week" | "day">("week");
  useEffect(() => {
    const timer = window.setInterval(() => setToday(universityToday()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const week = mondayOf(selectedDay);
  const days = Array.from({ length: 5 }, (_, day) => addDays(week, day));
  const lessons = getDemoLessons(week);
  const dayLessons = lessons.filter(lesson => lesson.date === selectedDay);
  function goToToday() { const date = universityToday(); setToday(date); setSelectedDay(date); }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Личное расписание</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Расписание студента</h2></div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Вид расписания" className="flex rounded-xl border border-gray-200 bg-white p-1">
          {([['week', 'Неделя'], ['day', 'День']] as const).map(([id, label]) => <Button key={id} variant={view === id ? "secondary" : "ghost"} aria-pressed={view === id} onClick={() => setView(id)} className={cn("rounded-lg", view === id && "bg-blue-50 text-blue-600")}>{label}</Button>)}
        </div>
        <DatePicker value={selectedDay} today={today} onSelect={date => { setSelectedDay(date); setView("day"); }} />
      </div>
      <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-4 sm:p-5">
          <div><h3 aria-live="polite" aria-atomic="true" className="text-base font-semibold sm:text-lg">{view === "week" ? weekLabel(week) : formatDate(selectedDay, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3><p className="mt-1 text-xs text-gray-500">Занятий: {view === "week" ? lessons.length : dayLessons.length}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            {view === "week" && week === mondayOf(today) && <Badge className="border-0 bg-blue-50 text-blue-600">Текущая неделя</Badge>}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1">
              <Button variant="ghost" size="icon" aria-label={view === "week" ? "Предыдущая неделя" : "Предыдущий день"} onClick={() => setSelectedDay(value => addDays(value, view === "week" ? -7 : -1))}><ArrowLeft /></Button>
              <Button variant="ghost" onClick={goToToday}>Сегодня</Button>
              <Button variant="ghost" size="icon" aria-label={view === "week" ? "Следующая неделя" : "Следующий день"} onClick={() => setSelectedDay(value => addDays(value, view === "week" ? 7 : 1))}><ArrowRight /></Button>
            </div>
          </div>
        </div>
        {view === "week" ? <WeekGrid days={days} lessons={lessons} today={today} /> : (
          <section aria-label="Занятия выбранного дня" className="p-4 sm:p-6">
            {dayLessons.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{dayLessons.map(lesson => <LessonCard key={lesson.id} lesson={lesson} />)}</div> : <div className="py-14 text-center"><CalendarDays aria-hidden="true" className="mx-auto mb-3 size-8 text-gray-400" /><p className="font-medium text-gray-700">На этот день занятий нет</p><p className="mt-2 text-sm text-gray-500">Выберите другую дату в календаре.</p></div>}
          </section>
        )}
        <p className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-500"><MousePointer2 aria-hidden="true" className="size-3.5 shrink-0" />Нажмите на занятие, чтобы посмотреть подробности</p>
      </Card>
      <section aria-label="Обозначения предметов" className="flex flex-wrap gap-x-5 gap-y-3">{Object.entries(subjects).map(([id, subject]) => <span key={id} className="inline-flex items-center gap-2 text-xs text-gray-600"><span aria-hidden="true" className={cn("size-2 rounded-full", subject.dot)} />{subject.name}</span>)}</section>
      <p className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-5 text-gray-500"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-blue-500" />Демонстрационные данные. Занятия повторяются каждую неделю.</p>
    </div>
  );
}
