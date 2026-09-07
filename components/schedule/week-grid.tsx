"use client";

import LessonCard from "./lesson-card";
import { formatDate, timeSlots, weekdays, type Lesson } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export default function WeekGrid({ days, lessons, today }: { days: string[]; lessons: Lesson[]; today: string }) {
  return (
    <div className="relative max-w-full overflow-x-auto focus-visible:outline-blue-600" tabIndex={0} role="region" aria-label="Недельное расписание, прокрутка по горизонтали">
      <table className="w-full min-w-[880px] table-fixed border-collapse text-left" aria-label="Недельное расписание с понедельника по пятницу">
        <thead><tr className="border-b border-gray-200">
          <th scope="col" className="w-[82px] px-3 py-5 text-xs font-medium text-gray-400">Время</th>
          {days.map((date, day) => <th key={date} scope="col" aria-current={date === today ? "date" : undefined} className={cn("border-l border-gray-100 px-3 py-4", date === today && "bg-blue-50/60")}>
            <div className={cn("text-xs font-medium", date === today ? "text-blue-600" : "text-gray-500")}>{weekdays[day]}</div>
            <div className="mt-2 flex items-center gap-2"><span className={cn("flex size-8 items-center justify-center rounded-full text-lg font-semibold", date === today ? "bg-blue-600 text-white" : "text-gray-900")}>{formatDate(date, { day: "numeric" })}</span>{date === today && <span className="text-[10px] font-semibold text-blue-600">Сегодня</span>}</div>
          </th>)}
        </tr></thead>
        <tbody>{timeSlots.map((slot, index) => <tr key={slot.start} className="border-b border-gray-100 last:border-0">
          <th scope="row" className="px-3 py-5 align-top"><span className="block text-sm font-semibold text-gray-600">{slot.start}</span><span className="mt-1 block text-xs font-normal text-gray-400">{slot.end}</span><span className="mt-3 block text-[10px] font-normal text-gray-400">{index + 1} пара</span></th>
          {days.map(date => {
            const matches = lessons.filter(lesson => lesson.date === date && lesson.slot === index);
            return <td key={date} className={cn("h-[152px] border-l border-gray-100 p-2 align-top", date === today && "bg-blue-50/30")}>{matches.length ? <div className="grid gap-2">{matches.map(lesson => <LessonCard key={lesson.id} lesson={lesson} />)}</div> : <span className="sr-only">Нет занятий</span>}</td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
  );
}

