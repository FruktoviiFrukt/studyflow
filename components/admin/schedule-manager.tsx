"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  DAYS,
  PARITIES,
  emptyLesson,
  matchesStudent,
  scheduleIssues,
  type AdminLesson,
  type ScheduleDraft,
} from "@/lib/admin-schedule";
import { Field, fieldClass, SelectField } from "./schedule-fields";
import LessonEditor from "./schedule-lesson-editor";
import Holidays from "./schedule-holidays";
import Preview from "./schedule-student-preview";
import DatePicker from "@/components/schedule/date-picker";
import { universityToday } from "@/lib/schedule";

type RecordData = ScheduleDraft & {
  version: string;
  validFrom: string;
  validTo: string;
  warnings: string[];
};
export default function ScheduleManager() {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [draft, setDraft] = useState<RecordData | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [upload, setUpload] = useState(false);
  const [confirmation, setConfirmation] = useState<
    "publish" | "unpublish" | "delete" | null
  >(null);
  const [editing, setEditing] = useState<AdminLesson | null>(null);
  const [preview, setPreview] = useState(false);
  const [group, setGroup] = useState("");
  const [search, setSearch] = useState("");
  const [subgroup, setSubgroup] = useState("1");
  const [parity, setParity] = useState("odd");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [first, setFirst] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/schedule", { cache: "no-store" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.message);
      setRecords(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetch("/api/admin/schedule", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.message);
        if (active) setRecords(body);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Ошибка загрузки");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);
  function accept(record: RecordData) {
    setDraft(record);
    setDirty(false);
    setRecords((current) => [
      record,
      ...current.filter((r) => r.id !== record.id),
    ]);
  }
  function update(patch: Partial<RecordData>) {
    setDraft((d) => d && { ...d, ...patch });
    setDirty(true);
    setNotice("");
  }
  async function action(name: "save" | "publish" | "unpublish" | "delete") {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/schedule/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: name,
          version: draft.version,
          lessons: draft.lessons,
          holidays: draft.holidays || [],
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.message);
      if (name === "delete") {
        setRecords((all) => all.filter((s) => s.id !== draft.id));
        setDraft(null);
        setDirty(false);
      } else accept(body);
      setNotice(
        name === "publish"
          ? "Расписание опубликовано и доступно студентам."
          : name === "delete"
            ? "Черновик удалён."
            : "Изменения сохранены в БД.",
      );
      setConfirmation(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setBusy(false);
    }
  }
  const groups = [
    ...new Set(
      draft?.lessons.flatMap((l) => l.audiences.map((a) => a.group)) || [],
    ),
  ].sort();
  const selectedGroup = groups.includes(group) ? group : groups[0] || "";
  const issues = draft ? scheduleIssues(draft.lessons) : [];
  const editable = draft?.status === "draft";
  return (
    <section className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5">
        <div>
          <h2 className="text-xl font-semibold">Расписание студентов</h2>
          <p className="mt-1 text-sm text-gray-500">
            Загрузка PDF, проверка и публикация
          </p>
        </div>
        <Button disabled={busy || dirty} onClick={() => setUpload(true)}>
          Новое расписание
        </Button>
      </header>
      {error && (
        <p
          role="alert"
          className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="m-5 rounded-lg bg-green-50 p-4 text-sm text-green-700"
        >
          {notice}
        </p>
      )}
      {!draft ? (
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Список расписаний</h3>
            <Button variant="outline" disabled={loading} onClick={load}>
              Обновить
            </Button>
          </div>
          {loading ? (
            <p role="status">Загрузка…</p>
          ) : !records.length ? (
            <p className="text-sm text-gray-500">
              Расписаний пока нет. Загрузите PDF.
            </p>
          ) : (
            records.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{r.filename}</p>
                  <p className="text-sm text-gray-500">
                    {r.year} · {r.course} курс · {r.semester} семестр ·{" "}
                    {r.status === "draft" ? "Черновик" : "Опубликовано"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraft(r);
                    setGroup("");
                  }}
                >
                  Открыть
                </Button>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5">
            <div>
              <h3 className="font-semibold">{draft.filename}</h3>
              <p className="text-sm text-gray-500">
                {draft.year} · {draft.course} курс · {draft.validFrom} —{" "}
                {draft.validTo}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={busy || dirty}
                onClick={() => {
                  setDraft(null);
                  void load();
                }}
              >
                К списку
              </Button>
              {draft.sourceUrl && (
                <Button asChild variant="outline">
                  <a href={draft.sourceUrl} target="_blank" rel="noreferrer">
                    Исходный PDF
                  </a>
                </Button>
              )}
              {dirty && (
                <Button
                  disabled={busy}
                  onClick={() => {
                    setDraft(records.find((r) => r.id === draft.id)!);
                    setDirty(false);
                  }}
                >
                  Отменить правки
                </Button>
              )}
            </div>
          </div>
          {draft.warnings.length > 0 && (
            <details className="border-b border-gray-200 bg-amber-50 p-5">
              <summary className="cursor-pointer text-sm font-medium">
                Замечания импорта ({draft.warnings.length})
              </summary>
              <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-xs">
                {draft.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
          <fieldset disabled={busy} className="min-w-0">
            <Holidays
              holidays={draft.holidays || []}
              editable={editable}
              onChange={(holidays) => update({ holidays })}
            />
            <div className="flex flex-wrap gap-2 p-5">
              <Button variant="outline" onClick={() => setPreview(!preview)}>
                {preview ? "Все занятия" : "Как у студента"}
              </Button>
              {editable && (
                <Button
                  variant="outline"
                  onClick={() => setEditing(emptyLesson())}
                >
                  Добавить занятие
                </Button>
              )}
              <span className="self-center text-sm text-gray-500">
                {draft.lessons.length} занятий · {issues.length} замечаний
                {dirty && " · Есть несохранённые изменения"}
              </span>
            </div>
            {!preview && (
              <div className="px-5 pb-4">
                <input
                  aria-label="Поиск занятий"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Предмет, преподаватель или группа"
                  className={fieldClass}
                />
              </div>
            )}
            {preview ? (
              <>
                <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
                  <SelectField
                    label="Группа"
                    value={selectedGroup}
                    onChange={(e) => setGroup(e.target.value)}
                  >
                    {groups.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Подгруппа"
                    value={subgroup}
                    onChange={(e) => setSubgroup(e.target.value)}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </SelectField>
                  <SelectField
                    label="Чётность"
                    value={parity}
                    onChange={(e) => setParity(e.target.value)}
                  >
                    <option value="odd">Нечётная</option>
                    <option value="even">Чётная</option>
                  </SelectField>
                </div>
                <Preview
                  lessons={draft.lessons.filter((l) =>
                    matchesStudent(l, selectedGroup, subgroup, parity),
                  )}
                  holidays={draft.holidays || []}
                  day=""
                  editable={editable}
                  issueIds={new Set(issues.map((i) => i.id))}
                  onEdit={setEditing}
                />
              </>
            ) : (
              <div className="max-h-[65vh] overflow-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      {[
                        "День / время",
                        "Предмет",
                        "Получатели",
                        "Проверка",
                        "Действия",
                      ].map((h) => (
                        <th key={h} className="p-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {draft.lessons
                      .filter((l) =>
                        `${l.subject} ${l.teacher} ${l.audiences.map((a) => a.group).join(" ")}`
                          .toLocaleLowerCase()
                          .includes(search.toLocaleLowerCase()),
                      )
                      .map((l) => (
                        <tr key={l.id} className="border-t border-gray-200">
                          <td className="p-3">
                            {DAYS[l.day]}
                            <br />
                            {l.start}–{l.end}
                            <br />
                            {PARITIES[l.parity]}
                          </td>
                          <td className="max-w-xs p-3">
                            <p>{l.subject}</p>
                            <p className="text-xs text-gray-500">
                              {l.teacher} · {l.room}
                            </p>
                          </td>
                          <td className="max-w-xs p-3">
                            {l.audiences
                              .map(
                                (a) =>
                                  `${a.group}${a.subgroup === "all" ? "" : ` (${a.subgroup})`}`,
                              )
                              .join(", ")}
                          </td>
                          <td className="max-w-xs p-3 text-xs text-amber-800">
                            {issues
                              .filter((i) => i.id === l.id)
                              .map((i) => i.message)
                              .join(" ") || "Проверено"}
                          </td>
                          <td className="p-3">
                            {editable && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditing(l)}
                                >
                                  Изменить
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    update({
                                      lessons: draft.lessons.filter(
                                        (a) => a.id !== l.id,
                                      ),
                                    })
                                  }
                                >
                                  Удалить
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer className="flex flex-wrap gap-3 border-t border-gray-200 p-5">
              {editable ? (
                <>
                  <Button disabled={!dirty} onClick={() => action("save")}>
                    Сохранить черновик
                  </Button>
                  <Button
                    disabled={dirty || !draft.lessons.length || !!issues.length}
                    onClick={() => setConfirmation("publish")}
                  >
                    Опубликовать
                  </Button>
                  <Button
                    variant="outline"
                    disabled={dirty}
                    onClick={() => setConfirmation("delete")}
                  >
                    Удалить черновик
                  </Button>
                </>
              ) : (
                <Button onClick={() => setConfirmation("unpublish")}>
                  Вернуть в черновик
                </Button>
              )}
            </footer>
          </fieldset>
        </>
      )}
      {editing && (
        <LessonEditor
          lesson={editing}
          onClose={() => setEditing(null)}
          onSave={(l) => {
            if (!draft) return;
            const next = { ...l, id: l.id || crypto.randomUUID() };
            update({
              lessons: l.id
                ? draft.lessons.map((a) => (a.id === l.id ? next : a))
                : [...draft.lessons, next],
            });
            setEditing(null);
          }}
        />
      )}
      <Dialog
        open={upload}
        onOpenChange={(open) => {
          if (!busy) setUpload(open);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Загрузить расписание</DialogTitle>
            <DialogDescription>
              PDF будет сохранён и разобран в черновик. Проверьте результат
              перед публикацией.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              form.set("from", from);
              form.set("to", to);
              form.set("first", first);
              setBusy(true);
              setError("");
              try {
                const r = await fetch("/api/admin/schedule", {
                  method: "POST",
                  body: form,
                });
                const body = await r.json();
                if (!r.ok) throw new Error(body.message);
                accept(body);
                setUpload(false);
                setNotice(
                  "PDF обработан. Проверьте занятия и распределение по подгруппам.",
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : "Ошибка импорта");
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy} className="space-y-4">
              <Field label="PDF расписания">
                <input
                  name="file"
                  type="file"
                  accept="application/pdf"
                  required
                  className={fieldClass}
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Учебный год">
                  <input
                    name="year"
                    defaultValue="2026/2027"
                    pattern="[0-9]{4}/[0-9]{4}"
                    required
                    className={fieldClass}
                  />
                </Field>
                <Field label="Курс">
                  <input
                    name="course"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="1"
                    required
                    className={fieldClass}
                  />
                </Field>
                <SelectField label="Семестр" name="semester">
                  <option value="1">1</option>
                  <option value="2">2</option>
                </SelectField>
              </div>
              {[
                ["Начало периода", from, setFrom],
                ["Конец периода", to, setTo],
                ["Первая нечётная неделя (понедельник)", first, setFirst],
              ].map(([label, value, change]) => (
                <div key={label as string}>
                  <p className="mb-1 text-sm">{label as string}</p>
                  <DatePicker
                    label={label as string}
                    value={value as string}
                    today={universityToday()}
                    showValue
                    onSelect={change as (value: string) => void}
                  />
                </div>
              ))}
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <Button type="submit">
                {busy ? "Распознаём PDF…" : "Загрузить и распознать"}
              </Button>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmation(null);
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Подтвердите действие</DialogTitle>
            <DialogDescription>
              {confirmation === "publish"
                ? "Расписание станет доступно студентам."
                : confirmation === "unpublish"
                  ? "Расписание будет скрыто от студентов до повторной публикации."
                  : "Черновик и его занятия будут удалены из БД."}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            disabled={busy}
            onClick={() => confirmation && action(confirmation)}
          >
            Подтвердить
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
