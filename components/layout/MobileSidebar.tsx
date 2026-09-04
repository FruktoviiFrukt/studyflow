"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Menu,
  X,
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  BookOpen,
  Sparkles,
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

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Menu button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Открыть меню"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 md:hidden"
      >
        <Menu size={22} />
      </button>

      {isOpen && (
        <>
          {/* Dark background */}
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
          />

          {/* Menu */}
          <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-white p-5 shadow-xl md:hidden">
            <div className="mb-8 flex items-center justify-between">
              <p className="font-semibold text-gray-900">
                Меню
              </p>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть меню"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={19} />

                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}