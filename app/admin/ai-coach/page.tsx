"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function AiCoachAdminPage() {
  const [subjects, setSubjects] = useState<FacultySubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);

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
          setError("Не удалось загрузить список предметов");
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/faculty-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as FacultySubject & { message?: string };
      if (!res.ok) {
        setFormError(data.message ?? "Ошибка при создании");
        return;
      }
      setSubjects((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setFormError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(s: FacultySubject) {
    setEditingId(s.id);
    setEditForm({ name: s.name, code: s.code, faculty: s.faculty });
  }

  async function handleSaveEdit(id: string) {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/faculty-subjects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = (await res.json()) as FacultySubject & { message?: string };
      if (!res.ok) return;
      setSubjects((prev) => prev.map((s) => (s.id === id ? data : s)));
      setEditingId(null);
    } finally {
      setEditSaving(false);
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

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/faculty-subjects/${id}`, { method: "DELETE" });
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen aria-hidden="true" className="size-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Предметы AI Coach
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Реестр официальных предметов факультета. Gemini получает этот список
            для автоматического определения предмета из загружаемого материала.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus aria-hidden="true" />
          Добавить предмет
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-5"
        >
          <p className="text-sm font-semibold text-gray-900">Новый предмет</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Название
              </label>
              <input
                type="text"
                placeholder="Математический анализ"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Код
              </label>
              <input
                type="text"
                placeholder="MATH101"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Факультет
              </label>
              <input
                type="text"
                placeholder="FCIM"
                value={form.faculty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, faculty: e.target.value }))
                }
                className={inputCls}
                required
              />
            </div>
          </div>

          {formError && <p className="text-xs text-rose-600">{formError}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving} size="sm">
              {saving ? <Loader2 className="animate-spin" /> : <Check />}
              Сохранить
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
                setFormError(null);
              }}
            >
              Отмена
            </Button>
          </div>
        </form>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="size-4 animate-spin" />
          Загрузка…
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {!loading && subjects.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <BookOpen className="mx-auto size-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">
            Предметы ещё не добавлены. Нажмите «Добавить предмет».
          </p>
        </div>
      )}

      {subjects.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Название</th>
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">Факультет</th>
                <th className="px-4 py-3 text-center">Тем</th>
                <th className="px-4 py-3 text-center">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                >
                  {editingId === s.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className={inputCls}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.code}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, code: e.target.value }))
                          }
                          className={cn(inputCls, "w-28")}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.faculty}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              faculty: e.target.value,
                            }))
                          }
                          className={cn(inputCls, "w-24")}
                        />
                      </td>
                      <td className="px-4 py-2 text-center text-gray-500">
                        {s._count.topics}
                      </td>
                      <td />
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            disabled={editSaving}
                            onClick={() => handleSaveEdit(s.id)}
                          >
                            {editSaving ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Check />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600">
                        {s.code}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.faculty}</td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {s._count.topics}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(s)}
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                            s.active
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                          )}
                        >
                          {s.active ? "Активен" : "Архив"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Редактировать"
                            onClick={() => startEdit(s)}
                            className="size-8 text-gray-400 hover:text-gray-700"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Удалить"
                            disabled={
                              deletingId === s.id || s._count.topics > 0
                            }
                            onClick={() => handleDelete(s.id)}
                            className="size-8 text-gray-400 hover:text-rose-600"
                            title={
                              s._count.topics > 0
                                ? "Нельзя удалить: есть темы"
                                : "Удалить"
                            }
                          >
                            {deletingId === s.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
