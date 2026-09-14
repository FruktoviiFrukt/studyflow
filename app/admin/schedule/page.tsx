"use client";

import { FormEvent, useMemo, useState } from "react";

type WeekDay =
  "Понедельник" | "Вторник" | "Среда" | "Четверг" | "Пятница" | "Суббота";

type LessonType = "Лекция" | "Практика" | "Лабораторная";

type WeekType = "Каждую неделю" | "Чётная неделя" | "Нечётная неделя";

type Lesson = {
  id: number;
  subject: string;
  teacher: string;
  group: string;
  day: WeekDay;
  startTime: string;
  endTime: string;
  room: string;
  lessonType: LessonType;
  weekType: WeekType;
};

type LessonForm = Omit<Lesson, "id">;

const weekDays: WeekDay[] = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

const initialLessons: Lesson[] = [
  {
    id: 1,
    subject: "Web Programming",
    teacher: "Мария Чебан",
    group: "FAF-231",
    day: "Понедельник",
    startTime: "08:00",
    endTime: "09:30",
    room: "3-205",
    lessonType: "Лекция",
    weekType: "Каждую неделю",
  },
  {
    id: 2,
    subject: "Базы данных",
    teacher: "Андрей Русу",
    group: "FAF-231",
    day: "Понедельник",
    startTime: "09:45",
    endTime: "11:15",
    room: "3-304",
    lessonType: "Лабораторная",
    weekType: "Чётная неделя",
  },
  {
    id: 3,
    subject: "Компьютерные сети",
    teacher: "Виктор Морару",
    group: "FAF-231",
    day: "Понедельник",
    startTime: "09:45",
    endTime: "11:15",
    room: "3-312",
    lessonType: "Практика",
    weekType: "Нечётная неделя",
  },
  {
    id: 4,
    subject: "Математический анализ",
    teacher: "Елена Платон",
    group: "TI-232",
    day: "Вторник",
    startTime: "11:30",
    endTime: "13:00",
    room: "1-214",
    lessonType: "Лекция",
    weekType: "Каждую неделю",
  },
  {
    id: 5,
    subject: "Объектно-ориентированное программирование",
    teacher: "Ирина Попеску",
    group: "TI-232",
    day: "Среда",
    startTime: "13:15",
    endTime: "14:45",
    room: "3-402",
    lessonType: "Лабораторная",
    weekType: "Каждую неделю",
  },
];

const emptyForm: LessonForm = {
  subject: "",
  teacher: "",
  group: "",
  day: "Понедельник",
  startTime: "08:00",
  endTime: "09:30",
  room: "",
  lessonType: "Лекция",
  weekType: "Каждую неделю",
};

export default function AdminSchedulePage() {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("Все");
  const [dayFilter, setDayFilter] = useState<"Все" | WeekDay>("Все");
  const [weekFilter, setWeekFilter] = useState<"Все" | WeekType>("Все");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [form, setForm] = useState<LessonForm>(emptyForm);

  const groups = useMemo(
    () => Array.from(new Set(lessons.map((lesson) => lesson.group))).sort(),
    [lessons],
  );

  const filteredLessons = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return lessons
      .filter((lesson) => {
        const matchesSearch =
          lesson.subject.toLowerCase().includes(normalizedSearch) ||
          lesson.teacher.toLowerCase().includes(normalizedSearch) ||
          lesson.room.toLowerCase().includes(normalizedSearch);

        const matchesGroup =
          groupFilter === "Все" || lesson.group === groupFilter;

        const matchesDay = dayFilter === "Все" || lesson.day === dayFilter;

        const matchesWeek =
          weekFilter === "Все" || lesson.weekType === weekFilter;

        return matchesSearch && matchesGroup && matchesDay && matchesWeek;
      })
      .sort((firstLesson, secondLesson) => {
        const dayDifference =
          weekDays.indexOf(firstLesson.day) -
          weekDays.indexOf(secondLesson.day);

        if (dayDifference !== 0) return dayDifference;

        return firstLesson.startTime.localeCompare(secondLesson.startTime);
      });
  }, [lessons, search, groupFilter, dayFilter, weekFilter]);

  function openCreateModal() {
    setEditingLessonId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setForm({
      subject: lesson.subject,
      teacher: lesson.teacher,
      group: lesson.group,
      day: lesson.day,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      room: lesson.room,
      lessonType: lesson.lessonType,
      weekType: lesson.weekType,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingLessonId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.endTime <= form.startTime) {
      window.alert("Время окончания должно быть позже времени начала.");
      return;
    }

    const lessonData: LessonForm = {
      ...form,
      subject: form.subject.trim(),
      teacher: form.teacher.trim(),
      group: form.group.trim().toUpperCase(),
      room: form.room.trim(),
    };

    if (editingLessonId !== null) {
      setLessons((currentLessons) =>
        currentLessons.map((lesson) =>
          lesson.id === editingLessonId
            ? { id: lesson.id, ...lessonData }
            : lesson,
        ),
      );
    } else {
      setLessons((currentLessons) => [
        ...currentLessons,
        {
          id: Date.now(),
          ...lessonData,
        },
      ]);
    }

    closeModal();
  }

  function deleteLesson(lesson: Lesson) {
    const isConfirmed = window.confirm(
      `Удалить занятие «${lesson.subject}» для группы ${lesson.group}?`,
    );

    if (!isConfirmed) return;

    setLessons((currentLessons) =>
      currentLessons.filter((item) => item.id !== lesson.id),
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Расписание</h2>

            <p className="mt-1 text-sm text-gray-500">
              Управление занятиями, аудиториями и учебными неделями
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Добавить занятие
          </button>
        </div>

        <div className="grid gap-3 border-b border-gray-200 p-5 md:grid-cols-2 xl:grid-cols-[1fr_180px_190px_200px]">
          <label>
            <span className="sr-only">Поиск занятий</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Предмет, преподаватель или аудитория"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            aria-label="Фильтр по группе"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="Все">Все группы</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>

          <select
            value={dayFilter}
            onChange={(event) =>
              setDayFilter(event.target.value as "Все" | WeekDay)
            }
            aria-label="Фильтр по дню"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="Все">Все дни</option>
            {weekDays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>

          <select
            value={weekFilter}
            onChange={(event) =>
              setWeekFilter(event.target.value as "Все" | WeekType)
            }
            aria-label="Фильтр по типу недели"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="Все">Все недели</option>
            <option value="Каждую неделю">Каждую неделю</option>
            <option value="Чётная неделя">Чётные недели</option>
            <option value="Нечётная неделя">Нечётные недели</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  День и время
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Дисциплина
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Группа
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Тип
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Аудитория
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Неделя
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Действия
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredLessons.map((lesson) => (
                <tr
                  key={lesson.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {lesson.day}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {lesson.startTime}–{lesson.endTime}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {lesson.subject}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {lesson.teacher}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {lesson.group}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {lesson.lessonType}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {lesson.room}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        lesson.weekType === "Каждую неделю"
                          ? "bg-blue-100 text-blue-700"
                          : lesson.weekType === "Чётная неделя"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {lesson.weekType}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(lesson)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Изменить
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteLesson(lesson)}
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

          {filteredLessons.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">Занятия не найдены</p>
              <p className="mt-1 text-sm text-gray-500">
                Измени поисковый запрос или выбранные фильтры
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-5 py-4">
          <p className="text-sm text-gray-500">
            Найдено занятий: {filteredLessons.length}
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
            aria-labelledby="lesson-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="lesson-modal-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {editingLessonId === null
                    ? "Новое занятие"
                    : "Редактирование занятия"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Укажи предмет, группу, время и тип недели
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
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Дисциплина"
                  value={form.subject}
                  placeholder="Web Programming"
                  onChange={(value) => setForm({ ...form, subject: value })}
                />

                <FormInput
                  label="Преподаватель"
                  value={form.teacher}
                  placeholder="Имя и фамилия"
                  onChange={(value) => setForm({ ...form, teacher: value })}
                />

                <FormInput
                  label="Группа"
                  value={form.group}
                  placeholder="FAF-231"
                  onChange={(value) => setForm({ ...form, group: value })}
                />

                <FormInput
                  label="Аудитория"
                  value={form.room}
                  placeholder="3-205"
                  onChange={(value) => setForm({ ...form, room: value })}
                />

                <FormSelect
                  label="День недели"
                  value={form.day}
                  options={weekDays}
                  onChange={(value) =>
                    setForm({ ...form, day: value as WeekDay })
                  }
                />

                <FormSelect
                  label="Тип занятия"
                  value={form.lessonType}
                  options={["Лекция", "Практика", "Лабораторная"]}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      lessonType: value as LessonType,
                    })
                  }
                />

                <FormInput
                  label="Начало"
                  type="time"
                  value={form.startTime}
                  onChange={(value) => setForm({ ...form, startTime: value })}
                />

                <FormInput
                  label="Окончание"
                  type="time"
                  value={form.endTime}
                  onChange={(value) => setForm({ ...form, endTime: value })}
                />
              </div>

              <FormSelect
                label="Повторение занятия"
                value={form.weekType}
                options={["Каждую неделю", "Чётная неделя", "Нечётная неделя"]}
                onChange={(value) =>
                  setForm({
                    ...form,
                    weekType: value as WeekType,
                  })
                }
              />

              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                Для одной пары можно создать две записи на одинаковое время:
                одну для чётной недели, вторую — для нечётной.
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
                  {editingLessonId === null ? "Добавить" : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

type FormInputProps = {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "time";
  onChange: (value: string) => void;
};

function FormInput({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: FormInputProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        required
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

type FormSelectProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
};

function FormSelect({ label, value, options, onChange }: FormSelectProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
