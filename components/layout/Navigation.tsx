"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, ChevronDown, LayoutDashboard, ListTodo, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const scheduleLinks = [
  { href: "/schedule", name: "Расписание студента" },
  { href: "/schedule/assessments", name: "Аттестации и экзамены" },
  { href: "/schedule/global", name: "Глобальное расписание" },
];
const items = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Задания", href: "/tasks", icon: ListTodo },
  { name: "Расписание", href: "/schedule", icon: CalendarDays },
  { name: "Средний балл", href: "/gpa", icon: ChartNoAxesColumnIncreasing },
  { name: "Материалы", href: "/materials", icon: BookOpen },
  { name: "AI Exam Coach", href: "/ai-coach", icon: Sparkles },
];

export default function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const scheduleMenuId = useId();
  return (
    <nav aria-label="Основная навигация" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      {items.map(({ name, href, icon: Icon }) => {
        const isSchedule = href === "/schedule";
        const active = isSchedule ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
        return (
          <div key={href}>
            {isSchedule ? (
              <button type="button" aria-expanded={scheduleOpen} aria-controls={scheduleMenuId} onClick={() => setScheduleOpen(open => !open)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600", active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
                <Icon aria-hidden="true" size={19} className="shrink-0" /><span>{name}</span>
                <ChevronDown aria-hidden="true" size={16} className={cn("ml-auto shrink-0 transition-transform", scheduleOpen && "rotate-180")} />
              </button>
            ) : <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600", active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
              <Icon aria-hidden="true" size={19} className="shrink-0" /><span>{name}</span>
              {href === "/ai-coach" && <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">AI</span>}
            </Link>}
            {isSchedule && (
              <ul id={scheduleMenuId} hidden={!scheduleOpen} className="my-2 ml-5 space-y-1 border-l border-gray-200 pl-3">
                {scheduleLinks.map((child) => <li key={child.href}><Link href={child.href} onClick={onNavigate} aria-current={pathname === child.href ? "page" : undefined}
                  className={cn("block rounded-lg px-2 py-2 text-xs leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600", pathname === child.href ? "bg-blue-50 font-semibold text-blue-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900")}>{child.name}</Link></li>)}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
