"use client";

import { FormEvent, useMemo, useState } from "react";

type SubjectStatus = "Активна" | "Архив";
type Semester = "1 семестр" | "2 семестр";

type Subject = {
  id: number;
  name: string;
  code: string;
  teacher: string;
  faculty: string;
  semester: Semester;
  credits: number;
  status: SubjectStatus;
};

type SubjectForm = {
  name: string;
  code: string;
  teacher: string;
  faculty: string;
  semester: Semester;
  credits: string;
};

const initialSubjects: Subject[] = [
  {
    id: 1,
    name: "Web Programming",
    code: "WEB-201",
    teacher: "Мария Чебан",
    faculty: "FCIM",
    semester: "1 семестр",
    credits: 5,
    status: "Активна",
  },
  {
    id: 2,
    name: "Базы данных",
    code: "DB-202",
    teacher: "Андрей Русу",
    faculty: "FCIM",
    semester: "1 семестр",
    credits: 4,
    status: "Активна",
  },
  {
    id: 3,
    name: "Объектно-ориентированное программирование",
    code: "OOP-203",
    teacher: "Ирина Попеску",
    faculty: "FCIM",
    semester: "2 семестр",
    credits: 5,
    status: "Активна",
  },
  {
    id: 4,
    name: "Компьютерные сети",
    code: "NET-204",
    teacher: "Виктор Морару",
    faculty: "FCIM",
    semester: "2 семестр",
    credits: 4,
    status: "Архив",
  },
  {
    id: 5,
    name: "Математический анализ",
    code: "MATH-101",
    teacher: "Елена Платон",
    faculty: "FCIM",
    semester: "1 семестр",
    credits: 6,
    status: "Активна",
  },
];

const emptyForm: SubjectForm = {
  name: "",
  code: "",
  teacher: "",
  faculty: "FCIM",
  semester: "1 семестр",
  credits: "4",
};

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<"Все" | Semester>("Все");
  const [statusFilter, setStatusFilter] = useState<"Все" | SubjectStatus>(
    "Все",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [form, setForm] = useState<SubjectForm>(emptyForm);

  const filteredSubjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      const matchesSearch =
        subject.name.toLowerCase().includes(normalizedSearch) ||
        subject.code.toLowerCase().includes(normalizedSearch) ||
        subject.teacher.toLowerCase().includes(normalizedSearch);

      const matchesSemester =
        semesterFilter === "Все" || subject.semester === semesterFilter;

      const matchesStatus =
        statusFilter === "Все" || subject.status === statusFilter;

      return matchesSearch && matchesSemester && matchesStatus;
    });
  }, [subjects, search, semesterFilter, statusFilter]);

  function openCreateModal() {
    setEditingSubjectId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(subject: Subject) {
    setEditingSubjectId(subject.id);
    setForm({
      name: subject.name,
      code: subject.code,
      teacher: subject.teacher,
      faculty: subject.faculty,
      semester: subject.semester,
      credits: String(subject.credits),
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingSubjectId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const subjectData = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      teacher: form.teacher.trim(),
      faculty: form.faculty.trim().toUpperCase(),
      semester: form.semester,
      credits: Number(form.credits),
    };

    if (editingSubjectId !== null) {
      setSubjects((currentSubjects) =>
        currentSubjects.map((subject) =>
          subject.id === editingSubjectId
            ? { ...subject, ...subjectData }
            : subject,
        ),
      );
    } else {
      setSubjects((currentSubjects) => [
        {
          id: Date.now(),
          ...subjectData,
          status: "Активна",
        },
        ...currentSubjects,
      ]);
    }

    closeModal();
  }

  function toggleSubjectStatus(subjectId: number) {
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              status: subject.status === "Активна" ? "Архив" : "Активна",
            }
          : subject,
      ),
    );
  }

  function deleteSubject(subject: Subject) {
    const isConfirmed = window.confirm(`Удалить дисциплину «${subject.name}»?`);

    if (!isConfirmed) return;

    setSubjects((currentSubjects) =>
      currentSubjects.filter((item) => item.id !== subject.id),
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Дисциплины</h2>

            <p className="mt-1 text-sm text-gray-500">
              Управление учебными дисциплинами университета
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Добавить дисциплину
          </button>
        </div>

        <div className="grid gap-3 border-b border-gray-200 p-5 md:grid-cols-[1fr_200px_180px]">
          <label>
            <span className="sr-only">Поиск дисциплин</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию, коду или преподавателю"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="sr-only">Фильтр по семестру</span>

            <select
              value={semesterFilter}
              onChange={(event) =>
                setSemesterFilter(event.target.value as "Все" | Semester)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Все">Все семестры</option>
              <option value="1 семестр">1 семестр</option>
              <option value="2 семестр">2 семестр</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Фильтр по статусу</span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "Все" | SubjectStatus)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Все">Все статусы</option>
              <option value="Активна">Активные</option>
              <option value="Архив">Архивные</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1050px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Дисциплина
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Преподаватель
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Факультет
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Семестр
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Кредиты
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
              {filteredSubjects.map((subject) => (
                <tr
                  key={subject.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {subject.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{subject.code}</p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {subject.teacher}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {subject.faculty}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {subject.semester}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {subject.credits}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        subject.status === "Активна"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {subject.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(subject)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Изменить
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSubjectStatus(subject.id)}
                        className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50"
                      >
                        {subject.status === "Активна"
                          ? "В архив"
                          : "Активировать"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSubject(subject)}
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

          {filteredSubjects.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">Дисциплины не найдены</p>
              <p className="mt-1 text-sm text-gray-500">
                Измени поисковый запрос или выбранные фильтры
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-5 py-4">
          <p className="text-sm text-gray-500">
            Найдено дисциплин: {filteredSubjects.length}
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
            aria-labelledby="subject-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="subject-modal-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {editingSubjectId === null
                    ? "Новая дисциплина"
                    : "Редактирование дисциплины"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Заполни информацию об учебной дисциплине
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
                  Название
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
                  placeholder="Например, Web Programming"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Код дисциплины
                  </span>

                  <input
                    required
                    value={form.code}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        code: event.target.value,
                      }))
                    }
                    placeholder="WEB-201"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Факультет
                  </span>

                  <input
                    required
                    value={form.faculty}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        faculty: event.target.value,
                      }))
                    }
                    placeholder="FCIM"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Преподаватель
                </span>

                <input
                  required
                  value={form.teacher}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      teacher: event.target.value,
                    }))
                  }
                  placeholder="Имя и фамилия преподавателя"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Семестр
                  </span>

                  <select
                    value={form.semester}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        semester: event.target.value as Semester,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="1 семестр">1 семестр</option>
                    <option value="2 семестр">2 семестр</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Количество кредитов
                  </span>

                  <input
                    required
                    type="number"
                    min="1"
                    max="30"
                    value={form.credits}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        credits: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

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
                  {editingSubjectId === null ? "Добавить" : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
