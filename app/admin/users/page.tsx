"use client";

import { FormEvent, useMemo, useState } from "react";

type UserRole = "Студент" | "Администратор";
type UserStatus = "Активен" | "Заблокирован";

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  group: string;
};

type UserForm = {
  name: string;
  email: string;
  role: UserRole;
  group: string;
};

const initialUsers: User[] = [
  {
    id: 1,
    name: "Анна Попеску",
    email: "anna.popescu@stud.utm.md",
    role: "Студент",
    status: "Активен",
    group: "FAF-231",
  },
  {
    id: 2,
    name: "Виктор Русу",
    email: "victor.rusu@stud.utm.md",
    role: "Студент",
    status: "Активен",
    group: "TI-232",
  },

  {
    id: 4,
    name: "Ион Платон",
    email: "ion.platon@stud.utm.md",
    role: "Студент",
    status: "Заблокирован",
    group: "FAF-231",
  },
  {
    id: 5,
    name: "Елена Морару",
    email: "elena.moraru@utm.md",
    role: "Администратор",
    status: "Активен",
    group: "—",
  },
];

const emptyForm: UserForm = {
  name: "",
  email: "",
  role: "Студент",
  group: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"Все" | UserRole>("Все");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.group.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === "Все" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  function openCreateModal() {
    setEditingUserId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      group: user.group === "—" ? "" : user.group,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUserId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUser: Omit<User, "id" | "status"> = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      group: form.role === "Студент" ? form.group.trim() || "Не указана" : "—",
    };

    if (editingUserId !== null) {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === editingUserId
            ? {
                ...user,
                ...normalizedUser,
              }
            : user,
        ),
      );
    } else {
      setUsers((currentUsers) => [
        {
          id: Date.now(),
          ...normalizedUser,
          status: "Активен",
        },
        ...currentUsers,
      ]);
    }

    closeModal();
  }

  function toggleUserStatus(userId: number) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "Активен" ? "Заблокирован" : "Активен",
            }
          : user,
      ),
    );
  }

  function deleteUser(user: User) {
    const isConfirmed = window.confirm(`Удалить пользователя «${user.name}»?`);

    if (!isConfirmed) return;

    setUsers((currentUsers) =>
      currentUsers.filter((item) => item.id !== user.id),
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Пользователи
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Управление аккаунтами и ролями пользователей
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Добавить пользователя
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Поиск пользователей</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по имени, почте или группе"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="sr-only">Фильтр по роли</span>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as "Все" | UserRole)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
            >
              <option value="Все">Все роли</option>
              <option value="Студент">Студенты</option>
              <option value="Преподаватель">Преподаватели</option>
              <option value="Администратор">Администраторы</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Пользователь
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Роль
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Группа
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Статус
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Действия
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
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

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {user.group}
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

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Изменить
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user.id)}
                        className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50"
                      >
                        {user.status === "Активен"
                          ? "Заблокировать"
                          : "Разблокировать"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteUser(user)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">
                Пользователи не найдены
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Измени поисковый запрос или выбранный фильтр
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-5 py-4">
          <p className="text-sm text-gray-500">
            Найдено пользователей: {filteredUsers.length}
          </p>
        </div>
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="user-modal-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {editingUserId === null
                    ? "Новый пользователь"
                    : "Редактирование пользователя"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Заполни информацию об аккаунте
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Закрыть окно"
                className="rounded-lg px-2 py-1 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Имя и фамилия
                </span>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Например, Анна Попеску"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Электронная почта
                </span>

                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      email: event.target.value,
                    }))
                  }
                  placeholder="name@stud.utm.md"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Роль
                </span>

                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      role: event.target.value as UserRole,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Студент">Студент</option>
                  <option value="Преподаватель">Преподаватель</option>
                  <option value="Администратор">Администратор</option>
                </select>
              </label>

              {form.role === "Студент" && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Учебная группа
                  </span>

                  <input
                    value={form.group}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        group: event.target.value,
                      }))
                    }
                    placeholder="Например, FAF-231"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingUserId === null ? "Добавить" : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
