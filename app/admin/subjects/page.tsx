"use client";

import { FormEvent, useMemo, useState } from "react";
import { BookOpen, MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";

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

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const dialogClass =
  "max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white text-gray-900 sm:max-w-xl";
const pageSize = 10;
const labels: Record<keyof SubjectForm, string> = {
  name: "Название",
  code: "Код дисциплины",
  faculty: "Факультет",
  teacher: "Преподаватель",
  semester: "Семестр",
  credits: "Кредиты ECTS",
};
function asForm(subject: Subject): SubjectForm {
  return {
    name: subject.name,
    code: subject.code,
    faculty: subject.faculty,
    teacher: subject.teacher,
    semester: subject.semester,
    credits: String(subject.credits),
  };
}
function Status({ value }: { value: SubjectStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${value === "Активна" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
    >
      {value}
    </span>
  );
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("Все");
  const [faculty, setFaculty] = useState("Все");
  const [status, setStatus] = useState("Все");
  const [sort, setSort] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{
    id: number | null;
    initial: SubjectForm;
  } | null>(null);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SubjectForm, string>>
  >({});
  const [discard, setDiscard] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [actionsId, setActionsId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{
    subject: Subject;
    action: "archive" | "delete";
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [deleted, setDeleted] = useState<Subject | null>(null);
  const detail = subjects.find((s) => s.id === detailId);
  const actions = subjects.find((s) => s.id === actionsId);
  const dirty =
    editor && JSON.stringify(form) !== JSON.stringify(editor.initial);
  const faculties = [...new Set(subjects.map((s) => s.faculty))].sort();
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const [key, direction] = sort.split("-");
    return subjects
      .filter(
        (s) =>
          `${s.name} ${s.code} ${s.teacher}`
            .toLocaleLowerCase()
            .includes(query) &&
          (semester === "Все" || s.semester === semester) &&
          (faculty === "Все" || s.faculty === faculty) &&
          (status === "Все" || s.status === status),
      )
      .sort(
        (a, b) =>
          (key === "code"
            ? a.code.localeCompare(b.code, "ru", { numeric: true })
            : a.name.localeCompare(b.name, "ru")) *
          (direction === "asc" ? 1 : -1),
      );
  }, [subjects, search, semester, faculty, status, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const hasFilters =
    !!search || semester !== "Все" || faculty !== "Все" || status !== "Все";
  function resetFilters() {
    setSearch("");
    setSemester("Все");
    setFaculty("Все");
    setStatus("Все");
    setPage(1);
  }
  function openEditor(subject?: Subject) {
    const initial = subject ? asForm(subject) : { ...emptyForm };
    setForm(initial);
    setEditor({ id: subject?.id ?? null, initial });
    setErrors({});
    setDetailId(null);
    setActionsId(null);
  }
  function closeEditor() {
    if (dirty) setDiscard(true);
    else setEditor(null);
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof SubjectForm, string>> = {};
    for (const key of ["name", "code", "faculty", "teacher"] as const) {
      if (!form[key].trim()) nextErrors[key] = "Заполните поле.";
    }
    if (
      subjects.some(
        (s) =>
          s.id !== editor?.id &&
          s.code.toLocaleLowerCase() === form.code.trim().toLocaleLowerCase(),
      )
    )
      nextErrors.code = "Дисциплина с таким кодом уже существует.";
    const credits = Number(form.credits);
    if (!Number.isInteger(credits) || credits < 1 || credits > 30)
      nextErrors.credits = "Укажите целое число от 1 до 30.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(`subject-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    const data = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      faculty: form.faculty.trim().toUpperCase(),
      teacher: form.teacher.trim(),
      credits,
    };
    setSubjects((all) =>
      editor?.id != null
        ? all.map((s) => (s.id === editor.id ? { ...s, ...data } : s))
        : [{ ...data, id: Date.now(), status: "Активна" }, ...all],
    );
    setNotice(
      editor?.id != null
        ? "Изменения применены к списку."
        : "Дисциплина добавлена в список.",
    );
    setDeleted(null);
    setEditor(null);
    resetFilters();
  }
  function changeStatus(subject: Subject) {
    setSubjects((all) =>
      all.map((s) =>
        s.id === subject.id
          ? { ...s, status: s.status === "Активна" ? "Архив" : "Активна" }
          : s,
      ),
    );
    setNotice(
      subject.status === "Активна"
        ? `«${subject.name}» перенесена в архив.`
        : `«${subject.name}» активирована.`,
    );
    setDeleted(null);
    setConfirm(null);
    setActionsId(null);
  }
  function remove() {
    if (!confirm) return;
    setSubjects((all) => all.filter((s) => s.id !== confirm.subject.id));
    setDeleted(confirm.subject);
    setNotice(`«${confirm.subject.name}» удалена из списка.`);
    setConfirm(null);
    setDetailId(null);
  }
  function renderActions(subject: Subject) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditor(subject)}
          aria-label={`Изменить ${subject.name}`}
        >
          Изменить
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Действия: ${subject.name}`}
          onClick={() => setActionsId(subject.id)}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-4 text-gray-900">
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-semibold">Дисциплины</h2>
            <p className="mt-1 text-sm text-gray-500">
              Справочник учебных дисциплин университета
            </p>
          </div>
          <Button onClick={() => openEditor()}>
            <Plus aria-hidden="true" />
            Добавить дисциплину
          </Button>
          <div className="flex w-full flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <span>
              Всего <strong className="text-gray-900">{subjects.length}</strong>
            </span>
            <span>
              Активных{" "}
              <strong className="text-emerald-700">
                {subjects.filter((s) => s.status === "Активна").length}
              </strong>
            </span>
            <span>
              В архиве{" "}
              <strong className="text-gray-700">
                {subjects.filter((s) => s.status === "Архив").length}
              </strong>
            </span>
          </div>
        </header>
        <div className="border-b border-gray-100 bg-slate-50/60 p-5 sm:px-6">
          <p className="mb-4 text-xs text-slate-600">
            Демонстрационный режим: изменения в списке сбросятся после
            перезагрузки страницы.
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="relative min-w-0 basis-full lg:flex-1">
              <span className="sr-only">Поиск дисциплин</span>
              <Search
                className="absolute left-3 top-2.5 size-4 text-gray-400"
                aria-hidden="true"
              />
              <input
                className={`${fieldClass} pl-9`}
                type="search"
                placeholder="Название, код или преподаватель"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            {[
              {
                label: "Факультет",
                value: faculty,
                set: setFaculty,
                options: faculties,
                all: "Все факультеты",
              },
              {
                label: "Семестр",
                value: semester,
                set: setSemester,
                options: ["1 семестр", "2 семестр"],
                all: "Все семестры",
              },
              {
                label: "Статус",
                value: status,
                set: setStatus,
                options: ["Активна", "Архив"],
                all: "Все статусы",
              },
            ].map((filter) => (
              <label
                key={filter.label}
                className="min-w-0 basis-full sm:basis-auto"
              >
                <span className="sr-only">{filter.label}</span>
                <select
                  aria-label={filter.label}
                  className={fieldClass}
                  value={filter.value}
                  onChange={(e) => {
                    filter.set(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="Все">{filter.all}</option>
                  {filter.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Найдено: {filtered.length}</span>
              {hasFilters && (
                <button
                  className="font-medium text-blue-600 hover:underline"
                  onClick={resetFilters}
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              Сортировка
              <select
                className="min-w-0 rounded-md border border-gray-200 bg-white p-2 text-gray-700"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="name-asc">Название: А–Я</option>
                <option value="name-desc">Название: Я–А</option>
                <option value="code-asc">Код: по возрастанию</option>
                <option value="code-desc">Код: по убыванию</option>
              </select>
            </label>
          </div>
        </div>
        {notice && (
          <div
            role="status"
            className="flex flex-wrap items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm text-emerald-800"
          >
            <span>{notice}</span>
            {deleted && (
              <button
                className="font-semibold underline"
                onClick={() => {
                  if (
                    subjects.some(
                      (s) =>
                        s.code.toLowerCase() === deleted.code.toLowerCase(),
                    )
                  ) {
                    setNotice("Не удалось восстановить: код уже используется.");
                    return;
                  }
                  setSubjects((all) => [...all, deleted]);
                  setDeleted(null);
                  setNotice("Дисциплина восстановлена.");
                }}
              >
                Отменить удаление
              </button>
            )}
            <button
              className="ml-auto underline"
              onClick={() => {
                setNotice("");
                setDeleted(null);
              }}
            >
              Скрыть
            </button>
          </div>
        )}
        {!!visible.length && (
          <>
            <table className="hidden w-full table-fixed text-left text-sm lg:table">
              <caption className="sr-only">Список дисциплин</caption>
              <thead className="border-b border-gray-100 text-xs text-gray-500">
                <tr>
                  <th scope="col" className="w-[30%] px-6 py-3">
                    Дисциплина
                  </th>
                  <th scope="col" className="w-[25%] px-4 py-3">
                    Преподавание
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Кредиты
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Статус
                  </th>
                  <th scope="col" className="w-40 px-6 py-3 text-right">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <button
                        className="text-left font-medium text-blue-700 hover:underline [overflow-wrap:anywhere]"
                        onClick={() => setDetailId(s.id)}
                      >
                        {s.name}
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        {s.code} · {s.faculty}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="break-words">{s.teacher}</p>
                      <p className="mt-1 text-xs text-gray-500">{s.semester}</p>
                    </td>
                    <td className="px-4 py-4">{s.credits} ECTS</td>
                    <td className="px-4 py-4">
                      <Status value={s.status} />
                    </td>
                    <td className="px-6 py-4">{renderActions(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="divide-y divide-gray-100 lg:hidden">
              {visible.map((s) => (
                <article key={s.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        className="text-left text-sm font-semibold text-blue-700 hover:underline [overflow-wrap:anywhere]"
                        onClick={() => setDetailId(s.id)}
                      >
                        {s.name}
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        {s.code} · {s.faculty}
                      </p>
                    </div>
                    <Status value={s.status} />
                  </div>
                  <p className="text-sm text-gray-600">{s.teacher}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">
                      {s.semester} · {s.credits} ECTS
                    </span>
                    {renderActions(s)}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {!filtered.length && (
          <div className="p-10 text-center">
            <BookOpen
              className="mx-auto mb-3 size-8 text-gray-300"
              aria-hidden="true"
            />
            <h3 className="font-semibold">
              {subjects.length
                ? "Дисциплины не найдены"
                : "Добавьте первую дисциплину"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {subjects.length
                ? "Попробуйте другой запрос или сбросьте фильтры."
                : "Создайте запись с названием и кодом предмета."}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={subjects.length ? resetFilters : () => openEditor()}
            >
              {subjects.length ? "Сбросить фильтры" : "Добавить дисциплину"}
            </Button>
          </div>
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 text-xs text-gray-500">
          <span>
            Показано {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filtered.length)} из{" "}
            {filtered.length}
          </span>
          {pages > 1 && (
            <nav
              aria-label="Страницы дисциплин"
              className="flex items-center gap-3"
            >
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Назад
              </Button>
              <span>
                {currentPage} / {pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Далее
              </Button>
            </nav>
          )}
        </footer>
      </section>
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      >
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle className="pr-6 leading-snug break-words">
              {detail?.name}
            </DialogTitle>
            <DialogDescription>
              {detail?.code} · Карточка дисциплины
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <Status value={detail.status} />
              <dl className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
                {(["faculty", "teacher", "semester", "credits"] as const).map(
                  (key) => (
                    <div key={key}>
                      <dt className="text-xs text-gray-500">{labels[key]}</dt>
                      <dd className="mt-1 break-words font-medium">
                        {detail[key]}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
              <Button onClick={() => openEditor(detail)}>
                Редактировать дисциплину
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!actions}
        onOpenChange={(open) => {
          if (!open) setActionsId(null);
        }}
      >
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle>Действия с дисциплиной</DialogTitle>
            <DialogDescription className="break-words">
              {actions?.name}
            </DialogDescription>
          </DialogHeader>
          {actions && (
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailId(actions.id);
                  setActionsId(null);
                }}
              >
                Открыть карточку
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (actions.status === "Архив") changeStatus(actions);
                  else {
                    setConfirm({ subject: actions, action: "archive" });
                    setActionsId(null);
                  }
                }}
              >
                {actions.status === "Архив"
                  ? "Активировать"
                  : "Перенести в архив"}
              </Button>
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() => {
                  setConfirm({ subject: actions, action: "delete" });
                  setActionsId(null);
                }}
              >
                Удалить дисциплину
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle>
              {confirm?.action === "delete"
                ? "Удалить дисциплину?"
                : "Перенести в архив?"}
            </DialogTitle>
            <DialogDescription className="break-words">
              {confirm?.subject.name}.{" "}
              {confirm?.action === "delete"
                ? "Запись будет удалена из текущего списка. Вместо удаления можно использовать архив."
                : "Запись останется в списке со статусом «Архив». Её можно снова активировать."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Отмена
            </Button>
            <Button
              className={
                confirm?.action === "delete"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : ""
              }
              onClick={() => {
                if (confirm?.action === "delete") remove();
                else if (confirm) changeStatus(confirm.subject);
              }}
            >
              {confirm?.action === "delete" ? "Удалить" : "В архив"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
      >
        <DialogContent
          className={dialogClass}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editor?.id != null
                ? "Редактирование дисциплины"
                : "Новая дисциплина"}
            </DialogTitle>
            <DialogDescription>
              Укажите сведения о предмете. Все поля обязательны.
            </DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={save} className="space-y-5">
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-3 text-sm font-semibold">
                Основные сведения
              </legend>
              {(["name", "code", "faculty"] as const).map((key) => (
                <label
                  key={key}
                  className={key === "name" ? "sm:col-span-2" : ""}
                >
                  <span className="mb-1.5 block text-sm">{labels[key]}</span>
                  <input
                    id={`subject-${key}`}
                    maxLength={key === "name" ? 160 : 40}
                    required
                    className={fieldClass}
                    value={form[key]}
                    aria-invalid={!!errors[key]}
                    aria-describedby={errors[key] ? `error-${key}` : undefined}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                  {errors[key] && (
                    <span
                      id={`error-${key}`}
                      className="mt-1 block text-xs text-red-600"
                    >
                      {errors[key]}
                    </span>
                  )}
                </label>
              ))}
            </fieldset>
            <fieldset className="grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
              <legend className="text-sm font-semibold">Преподавание</legend>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm">Преподаватель</span>
                <input
                  id="subject-teacher"
                  required
                  maxLength={160}
                  className={fieldClass}
                  value={form.teacher}
                  aria-invalid={!!errors.teacher}
                  aria-describedby={
                    errors.teacher ? "error-teacher" : undefined
                  }
                  onChange={(e) =>
                    setForm({ ...form, teacher: e.target.value })
                  }
                />
                {errors.teacher && (
                  <span
                    id="error-teacher"
                    className="mt-1 block text-xs text-red-600"
                  >
                    {errors.teacher}
                  </span>
                )}
              </label>
              <label>
                <span className="mb-1.5 block text-sm">Семестр</span>
                <select
                  className={fieldClass}
                  value={form.semester}
                  onChange={(e) =>
                    setForm({ ...form, semester: e.target.value as Semester })
                  }
                >
                  <option>1 семестр</option>
                  <option>2 семестр</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm">Кредиты ECTS</span>
                <input
                  id="subject-credits"
                  required
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  className={fieldClass}
                  value={form.credits}
                  aria-invalid={!!errors.credits}
                  aria-describedby={
                    errors.credits ? "error-credits" : undefined
                  }
                  onChange={(e) =>
                    setForm({ ...form, credits: e.target.value })
                  }
                />
                {errors.credits && (
                  <span
                    id="error-credits"
                    className="mt-1 block text-xs text-red-600"
                  >
                    {errors.credits}
                  </span>
                )}
              </label>
            </fieldset>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button type="button" variant="outline" onClick={closeEditor}>
                Отмена
              </Button>
              <Button type="submit">
                {editor?.id != null ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={discard} onOpenChange={setDiscard}>
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle>Отменить изменения?</DialogTitle>
            <DialogDescription>
              В форме есть несохранённые изменения. При закрытии они будут
              потеряны.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setDiscard(false)}>
              Продолжить редактирование
            </Button>
            <Button
              onClick={() => {
                setDiscard(false);
                setEditor(null);
              }}
            >
              Не сохранять
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
