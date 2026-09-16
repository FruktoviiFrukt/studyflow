"use client";

import MobileSidebar from "./MobileSidebar";
import UserMenu from "./UserMenu";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Задания",
  "/schedule": "Расписание",
  "/schedule/assessments": "Аттестации и экзамены",
  "/schedule/global": "Глобальное расписание",
  "/gpa": "Средний балл",
  "/materials": "Материалы",
  "/ai-coach": "AI Exam Coach",
};

export default function Header() {
  const pathname = usePathname();

  const title = pageTitles[pathname] || "StudyHub";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-5 md:px-8">
      {/* Current page */}
      <div className="flex min-w-0 items-center gap-3">
        <MobileSidebar />

        <h1 className="truncate text-base font-semibold tracking-tight text-gray-900 sm:text-xl">
          {title}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Уведомления"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600"
        >
          <Bell size={20} strokeWidth={2} />

          <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full border-2 border-white bg-blue-600" />
        </button>

        <div className="hidden h-7 w-px bg-gray-200 sm:block" />

        {/* User */}
        <UserMenu variant="header" />
      </div>
    </header>
  );
}
