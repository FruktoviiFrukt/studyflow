"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  BookOpen,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { SUBJECT_LIMITS, type CatalogSubject } from "@/lib/subject-catalog";

type Form = { name: string; code: string; faculty: string };
const emptyForm: Form = { name: "", code: "", faculty: "" };
const labels = {
  name: "Название",
  code: "Код дисциплины",
  faculty: "Факультет",
};
const statusLabels = { ACTIVE: "Активна", ARCHIVED: "Архив" };
const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const dialogClass =
  "max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white text-gray-900 sm:max-w-xl";
const pageSize = 10;
class ApiError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}
async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      data?.message || "Не удалось выполнить запрос. Попробуйте ещё раз.",
      data?.field,
    );
  if (data === null) throw new ApiError("Сервер вернул некорректный ответ.");
  return data as T;
}
function Status({ value }: { value: CatalogSubject["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${value === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
    >
      {statusLabels[value]}
    </span>
  );
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{
    id: string | null;
    initial: Form;
  } | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [discard, setDiscard] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [archive, setArchive] = useState<CatalogSubject | null>(null);
  const [notice, setNotice] = useState("");
  const load = useCallback((signal?: AbortSignal) => {
    return fetch("/api/admin/subjects", { cache: "no-store", signal })
      .then((response) => readResponse<CatalogSubject[]>(response))
      .then((data) => {
        if (!signal?.aborted) setSubjects(data);
      })
      .catch((error: unknown) => {
        if (!signal?.aborted)
          setLoadError(
            error instanceof ApiError
              ? error.message
              : "Не удалось загрузить дисциплины. Проверьте соединение и повторите попытку.",
          );
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);
  function reload() {
    setLoading(true);
    setLoadError("");
    void load();
  }
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const detail = subjects.find((s) => s.id === detailId);
  const actions = subjects.find((s) => s.id === actionsId);
  const dirty =
    editor && JSON.stringify(form) !== JSON.stringify(editor.initial);
  const faculties = [
    ...new Set(subjects.flatMap((s) => (s.faculty ? [s.faculty] : []))),
  ].sort();
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const [key, direction] = sort.split("-");
    return subjects
      .filter(
        (s) =>
          `${s.name} ${s.code ?? ""} ${s.faculty ?? ""}`
            .toLocaleLowerCase()
            .includes(query) &&
          (faculty === "ALL" ||
            (faculty === "NONE" ? !s.faculty : s.faculty === faculty)) &&
          (status === "ALL" || s.status === status),
      )
      .sort(
        (a, b) =>
          (key === "code"
            ? (a.code ?? "").localeCompare(b.code ?? "", "ru", {
                numeric: true,
              })
            : a.name.localeCompare(b.name, "ru")) *
          (direction === "asc" ? 1 : -1),
      );
  }, [subjects, search, faculty, status, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const hasFilters = !!search || faculty !== "ALL" || status !== "ALL";
  function resetFilters() {
    setSearch("");
    setFaculty("ALL");
    setStatus("ALL");
    setPage(1);
  }
  function openEditor(subject?: CatalogSubject) {
    const initial = subject
      ? {
          name: subject.name,
          code: subject.code ?? "",
          faculty: subject.faculty ?? "",
        }
      : { ...emptyForm };
    setForm(initial);
    setEditor({ id: subject?.id ?? null, initial });
    setErrors({});
    setFormError("");
    setDetailId(null);
    setActionsId(null);
  }
  function closeEditor() {
    if (busy) return;
    if (dirty) setDiscard(true);
    else setEditor(null);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutationLock.current || !editor) return;
    const nextErrors: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim()) nextErrors.name = "Укажите название.";
    for (const key of Object.keys(labels) as (keyof Form)[]) {
      if (form[key].trim().length > SUBJECT_LIMITS[key])
        nextErrors[key] = `Не более ${SUBJECT_LIMITS[key]} символов.`;
    }
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      document.getElementById(`subject-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    mutationLock.current = true;
    setBusy(true);
    try {
      const record = await readResponse<CatalogSubject>(
        await fetch(
          editor.id
            ? `/api/admin/subjects/${encodeURIComponent(editor.id)}`
            : "/api/admin/subjects",
          {
            method: editor.id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          },
        ),
      );
      setSubjects((all) => [record, ...all.filter((s) => s.id !== record.id)]);
      setNotice(editor.id ? "Изменения сохранены." : "Дисциплина добавлена.");
      setEditor(null);
      resetFilters();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.field &&
        Object.hasOwn(labels, error.field)
      ) {
        setErrors({ [error.field]: error.message });
        document.getElementById(`subject-${error.field}`)?.focus();
      } else
        setFormError(
          error instanceof ApiError
            ? error.message
            : "Не удалось сохранить. Проверьте соединение и попробуйте ещё раз.",
        );
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }
  async function changeStatus(subject: CatalogSubject) {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true);
    setActionError("");
    try {
      const record = await readResponse<CatalogSubject>(
        await fetch(`/api/admin/subjects/${encodeURIComponent(subject.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: subject.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE",
          }),
        }),
      );
      setSubjects((all) => all.map((s) => (s.id === record.id ? record : s)));
      setNotice(
        record.status === "ARCHIVED"
          ? `«${record.name}» перенесена в архив.`
          : `«${record.name}» активирована.`,
      );
      setArchive(null);
      setActionsId(null);
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Не удалось изменить статус. Повторите попытку.",
      );
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }
  function renderActions(subject: CatalogSubject) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          disabled={busy}
          variant="outline"
          size="sm"
          onClick={() => openEditor(subject)}
          aria-label={`Изменить ${subject.name}`}
        >
          Изменить
        </Button>
        <Button
          disabled={busy}
          variant="ghost"
          size="icon"
          aria-label={`Действия: ${subject.name}`}
          onClick={() => {
            setActionError("");
            setActionsId(subject.id);
          }}
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
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={loading || busy}
              variant="outline"
              onClick={reload}
              aria-label="Обновить список"
            >
              <RefreshCw aria-hidden="true" />
            </Button>
            <Button
              disabled={loading || !!loadError || busy}
              onClick={() => openEditor()}
            >
              <Plus aria-hidden="true" />
              Добавить дисциплину
            </Button>
          </div>
          {!loading && !loadError && (
            <div className="flex w-full flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
              <span>
                Всего{" "}
                <strong className="text-gray-900">{subjects.length}</strong>
              </span>
              <span>
                Активных{" "}
                <strong className="text-emerald-700">
                  {subjects.filter((s) => s.status === "ACTIVE").length}
                </strong>
              </span>
              <span>
                В архиве{" "}
                <strong className="text-gray-700">
                  {subjects.filter((s) => s.status === "ARCHIVED").length}
                </strong>
              </span>
            </div>
          )}
        </header>
        {loading ? (
          <div
            role="status"
            className="flex justify-center gap-2 p-12 text-sm text-gray-500"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Загрузка дисциплин…
          </div>
        ) : loadError ? (
          <div className="p-8 text-center">
            <p role="alert" className="text-sm text-red-700">
              {loadError}
            </p>
            <Button variant="outline" className="mt-4" onClick={reload}>
              Повторить загрузку
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-100 bg-slate-50/60 p-5 sm:px-6">
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
                    placeholder="Название, код или факультет"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                <label className="min-w-0 basis-full sm:basis-auto">
                  <span className="sr-only">Факультет</span>
                  <select
                    className={fieldClass}
                    value={faculty}
                    onChange={(e) => {
                      setFaculty(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="ALL">Все факультеты</option>
                    <option value="NONE">Не указан</option>
                    {faculties.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 basis-full sm:basis-auto">
                  <span className="sr-only">Статус</span>
                  <select
                    className={fieldClass}
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="ALL">Все статусы</option>
                    <option value="ACTIVE">Активные</option>
                    <option value="ARCHIVED">Архивные</option>
                  </select>
                </label>
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
                className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm text-emerald-800"
              >
                <span>{notice}</span>
                <button
                  className="ml-auto underline"
                  onClick={() => setNotice("")}
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
                      <th scope="col" className="w-[44%] px-6 py-3">
                        Дисциплина
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Факультет
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
                            {s.code || "Код не указан"}
                          </p>
                        </td>
                        <td className="break-words px-4 py-4">
                          {s.faculty || "Не указан"}
                        </td>
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
                          <p className="mt-1 break-words text-xs text-gray-500">
                            {s.code || "Код не указан"} ·{" "}
                            {s.faculty || "Факультет не указан"}
                          </p>
                        </div>
                        <Status value={s.status} />
                      </div>
                      {renderActions(s)}
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
                    : "Для создания достаточно указать название предмета."}
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
                Показано{" "}
                {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–
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
          </>
        )}
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
            <DialogDescription>Карточка дисциплины</DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <div>
                <Status value={detail.status} />
              </div>
              <dl className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
                {(["code", "faculty"] as const).map((key) => (
                  <div key={key}>
                    <dt className="text-xs text-gray-500">{labels[key]}</dt>
                    <dd className="mt-1 break-words font-medium">
                      {detail[key] || "Не указан"}
                    </dd>
                  </div>
                ))}
              </dl>
              <Button disabled={busy} onClick={() => openEditor(detail)}>
                Редактировать дисциплину
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!actions}
        onOpenChange={(open) => {
          if (!open && !busy) setActionsId(null);
        }}
      >
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle>Действия с дисциплиной</DialogTitle>
            <DialogDescription className="break-words">
              {actions?.name}
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <p role="alert" className="text-sm text-red-600">
              {actionError}
            </p>
          )}
          {actions && (
            <div className="grid gap-2">
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => {
                  setDetailId(actions.id);
                  setActionsId(null);
                }}
              >
                Открыть карточку
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => {
                  if (actions.status === "ARCHIVED") void changeStatus(actions);
                  else {
                    setActionError("");
                    setArchive(actions);
                    setActionsId(null);
                  }
                }}
              >
                {busy
                  ? "Сохранение…"
                  : actions.status === "ARCHIVED"
                    ? "Активировать"
                    : "Перенести в архив"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!archive}
        onOpenChange={(open) => {
          if (!open && !busy) setArchive(null);
        }}
      >
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle>Перенести в архив?</DialogTitle>
            <DialogDescription className="break-words">
              «{archive?.name}» останется в справочнике со статусом «Архив».
              Существующие занятия сохранятся. Дисциплину можно снова
              активировать.
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <p role="alert" className="text-sm text-red-600">
              {actionError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => setArchive(null)}
            >
              Отмена
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                if (archive) void changeStatus(archive);
              }}
            >
              {busy ? "Сохранение…" : "В архив"}
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
              {editor?.id ? "Редактирование дисциплины" : "Новая дисциплина"}
            </DialogTitle>
            <DialogDescription>
              Название обязательно. Код и факультет можно заполнить позже.
            </DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={save} className="space-y-5">
            <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(labels) as (keyof Form)[]).map((key) => (
                <label
                  key={key}
                  className={key === "name" ? "sm:col-span-2" : ""}
                >
                  <span className="mb-1.5 block text-sm">
                    {labels[key]}
                    {key === "name" ? " *" : ""}
                  </span>
                  <input
                    id={`subject-${key}`}
                    maxLength={SUBJECT_LIMITS[key]}
                    required={key === "name"}
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
                      role="alert"
                      className="mt-1 block text-xs text-red-600"
                    >
                      {errors[key]}
                    </span>
                  )}
                </label>
              ))}
            </fieldset>
            {formError && (
              <p role="alert" className="text-sm text-red-600">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button
                disabled={busy}
                type="button"
                variant="outline"
                onClick={closeEditor}
              >
                Отмена
              </Button>
              <Button disabled={busy} type="submit">
                {busy ? "Сохранение…" : editor?.id ? "Сохранить" : "Добавить"}
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
