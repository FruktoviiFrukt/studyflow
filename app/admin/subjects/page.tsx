"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

type FacultySubject = {
  id: string;
  name: string;
  code: string;
  faculty: string;
  active: boolean;
  _count: { topics: number };
};

type FormState = { name: string; code: string; faculty: string };
const EMPTY_FORM: FormState = { name: "", code: "", faculty: "FCIM" };

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<FacultySubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Все" | "Активна" | "Архив">(
    "Все",
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/faculty-subjects")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: FacultySubject[]) => {
        if (alive) {
          setSubjects(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError("Не удалось загрузить список дисциплин");
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subjects.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.faculty.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "Все" ||
        (statusFilter === "Активна" ? s.active : !s.active);
      return matchesSearch && matchesStatus;
    });
  }, [subjects, search, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEdit(s: FacultySubject) {
    setEditingId(s.id);
    setForm({ name: s.name, code: s.code, faculty: s.faculty });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/faculty-subjects/${editingId}`
        : "/api/admin/faculty-subjects";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as FacultySubject & { message?: string };
      if (!res.ok) {
        setFormError(data.message ?? "Ошибка при сохранении");
        return;
      }
      setSubjects((prev) =>
        editingId
          ? prev.map((s) => (s.id === editingId ? data : s))
          : [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      closeModal();
    } catch {
      setFormError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(s: FacultySubject) {
    const res = await fetch(`/api/admin/faculty-subjects/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    if (res.ok) {
      const data = (await res.json()) as FacultySubject;
      setSubjects((prev) => prev.map((sub) => (sub.id === s.id ? data : sub)));
    }
  }

  async function handleDelete(s: FacultySubject) {
    if (!window.confirm(`Удалить дисциплину «${s.name}»?`)) return;
    setDeletingId(s.id);
    try {
      await fetch(`/api/admin/faculty-subjects/${s.id}`, { method: "DELETE" });
      setSubjects((prev) => prev.filter((sub) => sub.id !== s.id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Дисциплины</h2>
            <p className="mt-1 text-sm text-gray-500">
              Реестр официальных дисциплин факультета. Gemini использует этот
              список для определения предмета при генерации квизов.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="size-4" />
            Добавить дисциплину
          </button>
        </div>

        <div className="grid gap-3 border-b border-gray-200 p-5 md:grid-cols-[1fr_180px]">
          <label>
            <span className="sr-only">Поиск дисциплин</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию, коду или факультету"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label>
            <span className="sr-only">Фильтр по статусу</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Все">Все статусы</option>
              <option value="Активна">Активные</option>
              <option value="Архив">Архивные</option>
            </select>
          </label>
        </div>

        {loading && (
          <div className="flex items-center gap-2 p-8 text-sm text-gray-400">
            <Loader2 className="size-4 animate-spin" />
            Загрузка…
          </div>
        )}
        {error && <p className="p-8 text-sm text-rose-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Дисциплина
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Факультет
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Тем в AI Coach
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
                {filtered.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {s.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-gray-500">
                        {s.code}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {s.faculty}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-center text-sm text-gray-600">
                      {s._count.topics}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(s)}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          s.active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {s.active ? "Активна" : "Архив"}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          <Pencil className="size-3" />
                          Изменить
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === s.id || s._count.topics > 0}
                          onClick={() => handleDelete(s)}
                          title={
                            s._count.topics > 0
                              ? "Нельзя удалить: есть темы в AI Coach"
                              : "Удалить"
                          }
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingId === s.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3" />
                          )}
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <p className="font-medium text-gray-700">
                        Дисциплины не найдены
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Измените поисковый запрос или фильтр
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className="border-t border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-500">
              Найдено дисциплин: {filtered.length}
            </p>
          </div>
        )}
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
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2
                id="subject-modal-title"
                className="text-xl font-semibold text-gray-900"
              >
                {editingId ? "Редактирование дисциплины" : "Новая дисциплина"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Закрыть"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="size-5" />
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Математический анализ"
                  className={inputCls}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Код
                  </span>
                  <input
                    required
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    placeholder="MATH101"
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Факультет
                  </span>
                  <input
                    required
                    value={form.faculty}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, faculty: e.target.value }))
                    }
                    placeholder="FCIM"
                    className={inputCls}
                  />
                </label>
              </div>

              {formError && (
                <p className="text-xs text-rose-600">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {editingId ? "Сохранить" : "Добавить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
