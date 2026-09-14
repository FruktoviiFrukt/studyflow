import Link from "next/link";
import StatCard from "@/components/admin/StatCard";

const statistics = [
  {
    title: "Пользователи",
    value: 248,
    description: "12 новых за последний месяц",
    color: "blue" as const,
  },
  {
    title: "Дисциплины",
    value: 32,
    description: "28 активных дисциплин",
    color: "green" as const,
  },
  {
    title: "Занятия",
    value: 156,
    description: "Запланировано на эту неделю",
    color: "orange" as const,
  },
  {
    title: "Материалы",
    value: 89,
    description: "7 материалов добавлено недавно",
    color: "purple" as const,
  },
];

const quickActions = [
  {
    title: "Добавить пользователя",
    description: "Создать новую учётную запись",
    href: "/admin/users",
    color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    title: "Добавить дисциплину",
    description: "Создать новую дисциплину",
    href: "/admin/subjects",
    color: "bg-green-50 text-green-700 hover:bg-green-100",
  },
  {
    title: "Изменить расписание",
    description: "Добавить или перенести занятие",
    href: "/admin/schedule",
    color: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
  {
    title: "Добавить материал",
    description: "Загрузить учебный файл",
    href: "/admin/materials",
    color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
  },
];

const recentUsers = [
  {
    id: 1,
    name: "Анна Попеску",
    email: "anna.popescu@stud.utm.md",
    role: "Студент",
    status: "Активен",
    registeredAt: "Сегодня, 10:24",
  },
  {
    id: 2,
    name: "Виктор Русу",
    email: "victor.rusu@stud.utm.md",
    role: "Студент",
    status: "Активен",
    registeredAt: "Сегодня, 09:18",
  },
  {
    id: 3,
    name: "Мария Чебан",
    email: "maria.ceban@utm.md",
    role: "Преподаватель",
    status: "Активен",
    registeredAt: "Вчера, 17:45",
  },
  {
    id: 4,
    name: "Ион Платон",
    email: "ion.platon@stud.utm.md",
    role: "Студент",
    status: "Заблокирован",
    registeredAt: "Вчера, 14:30",
  },
];

const recentActivity = [
  {
    id: 1,
    title: "Добавлена новая дисциплина",
    description: "Web Programming",
    time: "15 минут назад",
    color: "bg-green-500",
  },
  {
    id: 2,
    title: "Обновлено расписание",
    description: "Группа FAF-231",
    time: "40 минут назад",
    color: "bg-orange-500",
  },
  {
    id: 3,
    title: "Загружен новый материал",
    description: "Лекция №5 — Базы данных",
    time: "1 час назад",
    color: "bg-purple-500",
  },
  {
    id: 4,
    title: "Зарегистрирован пользователь",
    description: "Анна Попеску",
    time: "2 часа назад",
    color: "bg-blue-500",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900">Обзор системы</h2>

          <p className="mt-1 text-sm text-gray-500">
            Основная статистика платформы Studyflow
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((item) => (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              description={item.description}
              color={item.color}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Быстрые действия
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Основные инструменты администратора
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`rounded-xl p-4 transition-colors ${action.color}`}
            >
              <p className="font-semibold">{action.title}</p>

              <p className="mt-1 text-sm opacity-80">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Последние пользователи
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Недавно зарегистрированные аккаунты
              </p>
            </div>

            <Link
              href="/admin/users"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Посмотреть всех
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Пользователь
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Роль
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Статус
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Регистрация
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {recentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {user.name
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .slice(0, 2)}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>

                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {user.role}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.status === "Активен"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {user.registeredAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Последняя активность
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Недавние изменения в системе
            </p>
          </div>

          <div className="space-y-5">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div
                  aria-hidden="true"
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${activity.color}`}
                />

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>

                  <p className="mt-0.5 text-sm text-gray-500">
                    {activity.description}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
