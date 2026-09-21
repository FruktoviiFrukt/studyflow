import Link from "next/link";
import { auth } from "@/auth";
import { getDashboardData } from "@/lib/dashboard";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { TodayLessonsSummaryCard } from "@/components/dashboard/today-lessons-summary-card";
import { TodayScheduleProvider } from "@/components/dashboard/today-schedule-context";

import {
  CheckCircle2,
  Clock3,
  BookOpen,
  ClipboardList,
  Calculator,
  Upload,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const quickActions = [
  {
    title: "Новое задание",
    description: "Добавить новый дедлайн",
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    title: "Средний балл",
    description: "Перейти к калькулятору",
    href: "/gpa",
    icon: Calculator,
  },
  {
    title: "Загрузить материал",
    description: "Добавить учебный файл",
    href: "/materials",
    icon: Upload,
  },
  {
    title: "Начать AI-тест",
    description: "Подготовиться к экзамену",
    href: "/ai-coach",
    icon: Sparkles,
  },
];

function formatDeadline(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export default async function DashboardPage() {
  const session = await auth();
  const dashboard = session?.user?.id
    ? await getDashboardData(session.user.id)
    : null;

  const userName = dashboard?.user.name ?? "Студент";
  const userGroup = dashboard?.user.group;
  const subjects = dashboard?.subjectProgress ?? [];
  const tasks = dashboard?.tasks;
  const deadlines = tasks?.deadlines ?? [];

  return (
    <TodayScheduleProvider>
      <div className="mx-auto max-w-7xl">
        {/* Greeting */}
        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Личный кабинет
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Добро пожаловать, {userName}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {userGroup
              ? `Группа ${userGroup} · Здесь собрана основная информация о твоей учёбе.`
              : "Здесь собрана основная информация о твоей учёбе."}
          </p>
        </section>

        {/* Summary cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TodayLessonsSummaryCard />

          <SummaryCard
            title="Ближайшие дедлайны"
            value={String(tasks?.upcomingCount ?? 0)}
            description="В ближайшую неделю"
            icon={Clock3}
          />

          <SummaryCard
            title="Выполнено заданий"
            value={String(tasks?.completedCount ?? 0)}
            description="За всё время"
            icon={CheckCircle2}
          />

          <SummaryCard
            title="Учебные материалы"
            value="18"
            description="Доступных файлов"
            icon={BookOpen}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Today's schedule */}
          <TodaySchedule />

          {/* Deadlines */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ближайшие дедлайны
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Задания, которые нужно сдать
                </p>
              </div>

              <Link
                href="/tasks"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Все
              </Link>
            </div>

            <div className="space-y-3">
              {deadlines.length === 0 ? (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  Ближайших заданий нет.
                </p>
              ) : (
                deadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="rounded-xl border border-gray-100 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {deadline.subject}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {deadline.title}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <Clock3 size={14} />
                      <span>{formatDeadline(deadline.dueDate)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Subject progress */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 xl:col-span-2">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                Прогресс по предметам
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Текущий учебный прогресс
              </p>
            </div>

            <div className="space-y-5">
              {subjects.length === 0 ? (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  Добавьте оценки на странице среднего балла.
                </p>
              ) : (
                subjects.map((subject) => (
                  <div key={subject.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {subject.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Семестр {subject.semester}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {subject.progress}%
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {subject.grade === null
                            ? "Нет итоговой оценки"
                            : `${subject.grade.toFixed(2)} / 10`}
                        </p>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quick actions */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                Быстрые действия
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Часто используемые функции
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {action.title}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {action.description}
                      </p>
                    </div>

                    <ArrowRight
                      size={16}
                      className="text-gray-400 transition group-hover:text-blue-600"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </TodayScheduleProvider>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
};

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>

          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}
