import Link from "next/link";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  BookOpen,
  ClipboardList,
  Calculator,
  Upload,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const todaySchedule = [
  {
    time: "08:00 – 09:30",
    subject: "Программирование",
    type: "Лекция",
    classroom: "3-301",
  },
  {
    time: "09:45 – 11:15",
    subject: "Высшая математика",
    type: "Практика",
    classroom: "3-214",
  },
  {
    time: "11:30 – 13:00",
    subject: "Компьютерные сети",
    type: "Лабораторная",
    classroom: "3-302",
  },
];

const deadlines = [
  {
    subject: "Программирование",
    task: "Лабораторная работа №4",
    date: "9 сентября",
  },
  {
    subject: "Базы данных",
    task: "Практическая работа",
    date: "11 сентября",
  },
  {
    subject: "Компьютерные сети",
    task: "Отчёт по лабораторной",
    date: "13 сентября",
  },
];

const subjects = [
  {
    name: "Программирование",
    progress: 82,
  },
  {
    name: "Высшая математика",
    progress: 68,
  },
  {
    name: "Базы данных",
    progress: 74,
  },
  {
    name: "Компьютерные сети",
    progress: 57,
  },
];

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

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Greeting */}
      <section className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Личный кабинет
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Добро пожаловать, Student
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Здесь собрана основная информация о твоей учёбе.
        </p>
      </section>

      {/* Summary cards */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Занятия сегодня"
          value="3"
          description="Следующее занятие в 08:00"
          icon={CalendarDays}
        />

        <SummaryCard
          title="Ближайшие дедлайны"
          value="3"
          description="На этой неделе"
          icon={Clock3}
        />

        <SummaryCard
          title="Выполнено заданий"
          value="12"
          description="За текущий семестр"
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
        <section className="rounded-2xl border border-gray-200 bg-white p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Расписание на сегодня
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Занятия на текущий день
              </p>
            </div>

            <Link
              href="/schedule"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
              Всё расписание
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-3">
            {todaySchedule.map((lesson) => (
              <div
                key={`${lesson.time}-${lesson.subject}`}
                className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"
              >
                <div className="w-full sm:w-32">
                  <p className="text-sm font-semibold text-blue-600">
                    {lesson.time}
                  </p>
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {lesson.subject}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">{lesson.type}</p>
                </div>

                <div className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-600">
                  Каб. {lesson.classroom}
                </div>
              </div>
            ))}
          </div>
        </section>

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
            {deadlines.map((deadline) => (
              <div
                key={`${deadline.subject}-${deadline.task}`}
                className="rounded-xl border border-gray-100 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {deadline.subject}
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {deadline.task}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <Clock3 size={14} />
                  <span>{deadline.date}</span>
                </div>
              </div>
            ))}
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
            {subjects.map((subject) => (
              <div key={subject.name}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {subject.name}
                  </p>

                  <p className="text-sm font-semibold text-gray-900">
                    {subject.progress}%
                  </p>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>
            ))}
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
