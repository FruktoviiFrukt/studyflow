import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/auth";

// Only sections that exist; add a row here when a page is added.
const adminSections = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/schedule", label: "Расписание" },
];

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="mb-1 text-sm font-medium text-blue-600">
            Администрирование
          </p>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Панель администратора
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Управление пользователями, расписанием и учебными материалами
          </p>
        </header>

        <nav
          aria-label="Разделы панели администратора"
          className="mb-6 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
        >
          <div className="flex min-w-max gap-2">
            {adminSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                {section.label}
              </Link>
            ))}
          </div>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
