"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addDays, formatDate, mondayOf, parseDate } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export default function DatePicker({ value, today, onSelect }: { value: string; today: string; onSelect: (date: string) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7) + "-01");
  const start = mondayOf(month);
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  function moveMonth(offset: number) {
    const date = parseDate(month);
    date.setUTCMonth(date.getUTCMonth() + offset);
    setMonth(date.toISOString().slice(0, 10));
  }
  function select(date: string) { onSelect(date); setOpen(false); }
  return (
    <Dialog open={open} onOpenChange={(next) => { if (next) setMonth(value.slice(0, 7) + "-01"); setOpen(next); }}>
      <DialogTrigger asChild><Button variant="outline" className="rounded-xl"><CalendarDays aria-hidden="true" />Выбрать дату</Button></DialogTrigger>
      <DialogContent aria-describedby={undefined} className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-gray-200 bg-white p-4 text-gray-900 sm:rounded-2xl">
        <DialogTitle className="mb-2 text-base">Выберите день</DialogTitle>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Предыдущий месяц" onClick={() => moveMonth(-1)}><ArrowLeft /></Button>
          <p aria-live="polite" className="text-sm font-semibold capitalize">{formatDate(month, { month: "long", year: "numeric" })}</p>
          <Button variant="ghost" size="icon" aria-label="Следующий месяц" onClick={() => moveMonth(1)}><ArrowRight /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1" role="group" aria-label="Даты месяца">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => <span key={day} className="py-2 text-center text-xs text-gray-400">{day}</span>)}
          {days.map(date => (
            <button key={date} type="button" aria-label={formatDate(date, { day: "numeric", month: "long", year: "numeric" })}
              aria-pressed={date === value} aria-current={date === today ? "date" : undefined}
              onClick={() => select(date)}
              className={cn("aspect-square rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600", date === value ? "bg-blue-600 font-semibold text-white" : "hover:bg-blue-50", date !== value && (date.startsWith(month.slice(0, 7)) ? "text-gray-800" : "text-gray-400"), date === today && date !== value && "bg-blue-50 font-semibold text-blue-600")}>{Number(date.slice(-2))}</button>
          ))}
        </div>
        <Button variant="secondary" onClick={() => select(today)} className="rounded-xl">Сегодня</Button>
      </DialogContent>
    </Dialog>
  );
}

