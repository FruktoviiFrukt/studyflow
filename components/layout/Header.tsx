"use client";

import MobileSidebar from "./MobileSidebar";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Задания",
  "/schedule": "Расписание",
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
    <div className="flex items-center gap-3">

     <MobileSidebar />

    <h1 className="text-xl font-semibold tracking-tight text-gray-900">
    {title}
    </h1>
    </div>
 
      {/* Right side */}
      <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-4 text-gray-900">
              Student
            </p>

            <p className="mt-1 text-xs text-gray-500">
              student@utm.md
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            S
          </div>
        </div>
      </div>
    </header>
  );
}