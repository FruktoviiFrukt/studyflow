"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  BookOpen,
  Sparkles,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Задания",
    href: "/tasks",
    icon: ListTodo,
  },
  {
    name: "Расписание",
    href: "/schedule",
    icon: CalendarDays,
  },
  {
    name: "Средний балл",
    href: "/gpa",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    name: "Материалы",
    href: "/materials",
    icon: BookOpen,
  },
  {
    name: "AI Exam Coach",
    href: "/ai-coach",
    icon: Sparkles,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white px-4 py-5 md:flex">
      {/* Logo */}
      <div className="mb-7 border-b border-gray-100 px-2 pb-5">
        <Image
          src="/logo.jpg"
          alt="Логотип Политехнического Университета Молдовы"
          width={150}
          height={70}
          priority
          className="h-auto w-[145px] object-contain"
        />

        <p className="mt-3 max-w-[190px] text-xs font-medium leading-5 text-gray-500">
          Политехнический Университет Молдовы
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={19} strokeWidth={2} />

              <span>{item.name}</span>

              {item.href === "/ai-coach" && (
                <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 pt-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            S
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Student
            </p>

            <p className="truncate text-xs text-gray-500">
              student@utm.md
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut size={18} />

          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}