"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DAYS,
  PARITIES,
  audienceLabel,
  emptyLesson,
  initialSchedules,
  matchesStudent,
  publishDemo,
  scheduleIssues,
  type AdminLesson,
  type ScheduleDraft,
} from "@/lib/admin-schedule";
import { SelectField, fieldClass } from "./schedule-fields";
import ScheduleLessonEditor from "./schedule-lesson-editor";
import ScheduleStudentPreview from "./schedule-student-preview";
import ScheduleHolidays from "./schedule-holidays";
import ScheduleUpload, { type UploadDetails } from "./schedule-upload";

const statusLabels = {
  draft: "Черновик",
  published: "Опубликовано · демо",
};
function Status({ status }: { status: ScheduleDraft["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        status === "draft"
          ? "bg-orange-100 text-orange-700"
          : status === "published"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500",
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export default function ScheduleManager() {
  const [records, setRecords] = useState(initialSchedules);
  const [selectedId, setSelectedId] = useState("example-draft");
  const [screen, setScreen] = useState<"editor" | "imports">("editor");
  const [view, setView] = useState<"table" | "student">("table");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [subgroup, setSubgroup] = useState("all");
  const [parity, setParity] = useState("all");
  const [day, setDay] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [upload, setUpload] = useState(false);
  const [editing, setEditing] = useState<AdminLesson | null>(null);
  const [deleting, setDeleting] = useState<AdminLesson | null>(null);
  const [deletingDraft, setDeletingDraft] = useState<ScheduleDraft | null>(
    null,
  );
  const [publishing, setPublishing] = useState(false);
  const [source, setSource] = useState(false);
  const [notice, setNotice] = useState("");
  const urls = useRef<string[]>([]);
  useEffect(() => {
    const allocated = urls.current;
    return () => allocated.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  const selected = records.find((r) => r.id === selectedId) ??
    records[0] ?? {
      id: "",
      year: "",
      course: "",
      semester: "",
      filename: "",
      status: "draft" as const,
      lessons: [],
    };
  const editable = selected.status === "draft";
  const groups = [
    ...new Set(
      selected.lessons.flatMap((l) => l.audiences.map((a) => a.group)),
    ),
  ].sort();
  const effectiveGroup =
    view === "student" && !groups.includes(group) ? (groups[0] ?? "") : group;
  const issues = scheduleIssues(selected.lessons);
  const issueIds = new Set(issues.map((i) => i.id));
  const shown = selected.lessons
    .filter(
      (l) =>
        matchesStudent(l, effectiveGroup, subgroup, parity) &&
        (day === "" || l.day === Number(day)) &&
        (!onlyIssues || issueIds.has(l.id)) &&
        `${l.subject} ${l.teacher} ${l.room} ${l.audiences.map((a) => a.group).join(" ")}`
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
    )
    .sort(
      (a, b) =>
        a.day - b.day ||
        a.start.localeCompare(b.start) ||
        a.subject.localeCompare(b.subject),
    );
  const canPublish =
    editable && selected.lessons.length > 0 && issues.length === 0;
  function resetFilters() {
    setSearch("");
    setGroup("");
    setSubgroup("all");
    setParity("all");
    setDay("");
    setOnlyIssues(false);
  }
  function openRecord(id: string) {
    setSelectedId(id);
    setScreen("editor");
    setView("table");
    resetFilters();
    setNotice("");
  }
  function updateLessons(lessons: AdminLesson[]) {
    setRecords((current) =>
      current.map((r) => (r.id === selected.id ? { ...r, lessons } : r)),
    );
  }
  function saveLesson(lesson: AdminLesson) {
    const next = { ...lesson, id: lesson.id || crypto.randomUUID() };
    updateLessons(
      lesson.id
        ? selected.lessons.map((l) => (l.id === lesson.id ? next : l))
        : [...selected.lessons, next],
    );
    setEditing(null);
    setNotice("Занятие сохранено в демонстрационном черновике.");
  }
  function createUpload({ year, course, semester, file }: UploadDetails) {
    const sourceUrl = URL.createObjectURL(file);
    urls.current.push(sourceUrl);
    const id = crypto.randomUUID();
    setRecords((current) => [
      {
        id,
        year,
        course,
        semester,
        filename: file.name,
        sourceUrl,
        status: "draft",
        lessons: [],
      },
      ...current,
    ]);
    setUpload(false);
    openRecord(id);
    setNotice(
      "PDF прикреплён локально. Черновик пуст: добавьте занятия вручную. Файл не отправлялся на сервер.",
    );
  }
  function studentView() {
    resetFilters();
    setGroup(groups[0] ?? "");
    setSubgroup("1");
    setParity("odd");
    setView("student");
  }
  function deleteDraft() {
    const target = records.find((r) => r.id === deletingDraft?.id);
    if (!target || target.status !== "draft") return;
    const remaining = records.filter((r) => r.id !== target.id);
    if (
      target.sourceUrl &&
      !remaining.some((r) => r.sourceUrl === target.sourceUrl)
    ) {
      URL.revokeObjectURL(target.sourceUrl);
      const index = urls.current.indexOf(target.sourceUrl);
      if (index !== -1) urls.current.splice(index, 1);
    }
    setRecords(remaining);
    if (selected.id === target.id) {
      setSelectedId(remaining[0]?.id ?? "");
      resetFilters();
      setView("table");
      setEditing(null);
      setDeleting(null);
      setPublishing(false);
      setSource(false);
    }
    setDeletingDraft(null);
    setScreen("imports");
    setNotice(
      "Черновик удалён вместе с его занятиями. Другие расписания сохранены.",
    );
  }
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Расписание студентов
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Управление занятиями, группами и учебными неделями
          </p>
        </div>
        <Button
          className="h-auto rounded-lg bg-blue-600 px-4 py-2.5 shadow-none hover:bg-blue-700"
          onClick={() => setUpload(true)}
        >
          Новое расписание
        </Button>
      </div>
      {notice && (
        <p
          role="status"
          className="flex items-start gap-2 border-b border-green-100 bg-green-50 px-5 py-3 text-sm text-green-700"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {notice}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
        <div
          role="group"
          aria-label="Раздел расписания"
          className="inline-flex max-w-full flex-wrap gap-2"
        >
          <Button
            variant="ghost"
            aria-pressed={screen === "editor"}
            disabled={!records.length}
            className={cn(
              "rounded-lg",
              screen === "editor" && "bg-blue-50 text-blue-700",
            )}
            onClick={() => setScreen("editor")}
          >
            Рабочее расписание
          </Button>
          <Button
            variant="ghost"
            aria-pressed={screen === "imports"}
            className={cn(
              "rounded-lg",
              screen === "imports" && "bg-blue-50 text-blue-700",
            )}
            onClick={() => setScreen("imports")}
          >
            Список расписаний{" "}
            <span className="rounded-md bg-gray-100 px-1.5 text-xs text-gray-500">
              {records.length}
            </span>
          </Button>
        </div>
      </div>
      {screen === "imports" || !records.length ? (
        <section
          aria-label="Список расписаний"
          className="overflow-hidden bg-white"
        >
          <div className="border-b border-gray-100 p-5">
            <h3 className="font-semibold">Расписания</h3>
            <p className="mt-1 text-sm text-gray-500">
              Каждый файл относится к одному курсу, учебному году и семестру.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {!records.length && (
              <p className="p-10 text-center text-sm text-gray-500">
                Расписаний пока нет. Нажмите «Новое расписание», чтобы создать
                черновик.
              </p>
            )}
            {records.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold">
                      {r.filename}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {r.year} · {r.course} курс · {r.semester} семестр ·{" "}
                      {r.lessons.length} занятий
                    </p>
                    <div className="mt-2">
                      <Status status={r.status} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-lg shadow-none"
                    onClick={() => openRecord(r.id)}
                  >
                    Открыть
                    <ArrowRight />
                  </Button>
                  {r.status === "draft" && (
                    <Button
                      variant="outline"
                      className="rounded-lg border-red-200 text-red-700 shadow-none hover:bg-red-50"
                      onClick={() => setDeletingDraft(r)}
                    >
                      Удалить черновик
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/50 px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-all text-sm font-medium text-gray-900">
                  {selected.filename}
                </h3>
                <Status status={selected.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {selected.year} · {selected.course} курс · {selected.semester}{" "}
                семестр · {groups.length} групп
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.sourceUrl && (
                <Button
                  variant="outline"
                  className="rounded-lg border-gray-300 shadow-none"
                  onClick={() => setSource(true)}
                >
                  Исходный PDF
                </Button>
              )}
              {!editable && (
                <Button
                  variant="outline"
                  className="rounded-lg border-gray-300 shadow-none"
                  onClick={() => {
                    setRecords((current) =>
                      current.map((r) =>
                        r.id === selected.id ? { ...r, status: "draft" } : r,
                      ),
                    );
                    setNotice(
                      "Расписание возвращено в черновик для редактирования.",
                    );
                  }}
                >
                  Вернуть в черновик
                </Button>
              )}
            </div>
          </div>
          <ScheduleHolidays
            key={selected.id}
            holidays={selected.holidays ?? []}
            editable={editable}
            onChange={(holidays) =>
              setRecords((current) =>
                current.map((r) =>
                  r.id === selected.id ? { ...r, holidays } : r,
                ),
              )
            }
          />
          {issues.length > 0 && (
            <details className="border-b border-orange-100 bg-orange-50 px-5 py-3">
              <summary className="cursor-pointer text-sm font-medium text-orange-800">
                Требуется проверка: {issues.length}. Открыть замечания
              </summary>
              <ul className="mt-3 space-y-2">
                {issues.map((issue, i) => (
                  <li
                    key={`${issue.id}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm"
                  >
                    <span>
                      <strong>
                        {selected.lessons.find((l) => l.id === issue.id)
                          ?.subject || "Без предмета"}
                        .
                      </strong>{" "}
                      {issue.message}
                    </span>
                    {editable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditing(
                            selected.lessons.find((l) => l.id === issue.id)!,
                          )
                        }
                      >
                        Исправить
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {!editable && (
            <p className="border-b border-gray-200 px-5 py-3 text-sm text-gray-600">
              Расписание опубликовано. Чтобы внести изменения, верните его в
              черновик.
            </p>
          )}
          <section className="overflow-hidden bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5">
              <div
                role="group"
                aria-label="Представление занятий"
                className="flex flex-wrap gap-2"
              >
                <Button
                  variant="ghost"
                  aria-pressed={view === "table"}
                  className={cn(
                    "rounded-lg",
                    view === "table" && "bg-blue-50 text-blue-700",
                  )}
                  onClick={() => {
                    setView("table");
                    resetFilters();
                  }}
                >
                  Все занятия
                </Button>
                <Button
                  variant="ghost"
                  aria-pressed={view === "student"}
                  className={cn(
                    "rounded-lg",
                    view === "student" && "bg-blue-50 text-blue-700",
                  )}
                  onClick={studentView}
                >
                  Как у студента
                </Button>
              </div>
              {editable && (
                <Button
                  variant="outline"
                  className="rounded-lg shadow-none"
                  onClick={() => setEditing(emptyLesson())}
                >
                  <Plus />
                  Добавить занятие
                </Button>
              )}
            </div>
            <div className="space-y-3 border-b border-gray-200 p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectField
                  label="Группа"
                  value={effectiveGroup}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  {view === "table" && <option value="">Все группы</option>}
                  {!groups.length && view === "student" && (
                    <option value="">Нет групп</option>
                  )}
                  {groups.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </SelectField>
                <SelectField
                  label="Подгруппа"
                  value={subgroup}
                  onChange={(e) => setSubgroup(e.target.value)}
                >
                  {view === "table" && (
                    <option value="all">Все подгруппы</option>
                  )}
                  <option value="1">Подгруппа 1</option>
                  <option value="2">Подгруппа 2</option>
                </SelectField>
                <SelectField
                  label="Неделя"
                  value={parity}
                  onChange={(e) => setParity(e.target.value)}
                >
                  {view === "table" && <option value="all">Все недели</option>}
                  <option value="odd">Нечётная неделя</option>
                  <option value="even">Чётная неделя</option>
                </SelectField>
                <SelectField
                  label="День"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                >
                  <option value="">Вся неделя</option>
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </SelectField>
              </div>
              {view === "table" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-3 top-3 size-4 text-gray-400" />
                    <input
                      type="search"
                      aria-label="Поиск занятий"
                      placeholder="Предмет, преподаватель, группа или аудитория"
                      className={cn(fieldClass, "pl-9")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="size-4 accent-blue-600"
                      checked={onlyIssues}
                      onChange={(e) => setOnlyIssues(e.target.checked)}
                    />
                    Только с замечаниями
                  </label>
                  <Button variant="ghost" onClick={resetFilters}>
                    Сбросить
                  </Button>
                </div>
              ) : (
                <p className="text-xs leading-5 text-blue-700">
                  Предпросмотр выбранного студента: общие занятия группы +
                  подгруппа {subgroup}. Нечётная неделя — верхняя половина пары
                  в PDF, чётная — нижняя.
                </p>
              )}
            </div>
            {!shown.length ? (
              <div className="px-5 py-14 text-center">
                <CalendarDays className="mx-auto mb-3 size-9 text-gray-300" />
                <h3 className="font-semibold">
                  {selected.lessons.length
                    ? "Занятия не найдены"
                    : "Черновик пока пуст"}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  {selected.lessons.length
                    ? "Для выбранных фильтров занятий нет. Измените группу, день или неделю."
                    : "Откройте исходный PDF и добавьте занятия вручную. Автоматический импорт будет подключён позже."}
                </p>
                {!selected.lessons.length && editable && (
                  <Button
                    className="mt-4"
                    onClick={() => setEditing(emptyLesson())}
                  >
                    <Plus />
                    Добавить первое занятие
                  </Button>
                )}
              </div>
            ) : view === "table" ? (
              <div
                className="overflow-x-auto"
                role="region"
                aria-label="Таблица занятий"
                tabIndex={0}
              >
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      {[
                        "День и время",
                        "Занятие",
                        "Группы и подгруппы",
                        "Аудитория",
                        "Неделя",
                        "Проверка",
                        "Действия",
                      ].map((h) => (
                        <th
                          scope="col"
                          key={h}
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shown.map((l) => (
                      <tr key={l.id} className="align-top hover:bg-gray-50/60">
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-medium">{DAYS[l.day]}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {l.start}–{l.end}
                          </p>
                        </td>
                        <td className="max-w-[280px] px-5 py-4">
                          <p className="font-medium text-gray-900">
                            {l.subject}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {l.type} · {l.teacher || "Преподаватель не указан"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex max-w-[220px] flex-wrap gap-1">
                            {l.audiences.map((a, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-600"
                              >
                                {audienceLabel(a)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">{l.room || "Не указана"}</td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-xs",
                              l.parity === "odd"
                                ? "bg-violet-50 text-violet-700"
                                : l.parity === "even"
                                  ? "bg-sky-50 text-sky-700"
                                  : "bg-gray-100 text-gray-600",
                            )}
                          >
                            {PARITIES[l.parity]}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {issueIds.has(l.id) ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                              <AlertCircle className="size-4" />
                              Проверить
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                              <CheckCircle2 className="size-4" />
                              Готово
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {editable ? (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-auto rounded-lg border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-none hover:bg-blue-50"
                                aria-label={`Редактировать ${l.subject}, ${l.start}, ${l.audiences.map(audienceLabel).join(", ")}`}
                                onClick={() => setEditing(l)}
                              >
                                Изменить
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-auto rounded-lg border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 shadow-none hover:bg-red-50"
                                aria-label={`Удалить ${l.subject}, ${l.start}`}
                                onClick={() => setDeleting(l)}
                              >
                                Удалить
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Просмотр
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ScheduleStudentPreview
                holidays={selected.holidays ?? []}
                lessons={shown}
                day={day}
                editable={editable}
                issueIds={issueIds}
                onEdit={setEditing}
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-3">
              <span className="text-xs text-gray-500" aria-live="polite">
                {view === "student" ? "По фильтрам" : "Показано"} {shown.length}{" "}
                из {selected.lessons.length} занятий
                {view === "student" && " · занятия в каникулы скрыты в сетке"}
              </span>
              <span className="text-xs text-gray-500">
                Общие занятия включены при выборе подгруппы
              </span>
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-5 py-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className={cn(
                  "mt-0.5 size-5",
                  canPublish ? "text-emerald-600" : "text-gray-400",
                )}
              />
              <div>
                <p className="text-sm font-semibold">
                  {!editable
                    ? "Расписание опубликовано в демонстрационном режиме"
                    : canPublish
                      ? "Черновик готов к демонстрации публикации"
                      : "Сначала проверьте занятия"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {!selected.lessons.length
                    ? "Добавьте хотя бы одно занятие."
                    : issues.length
                      ? `Осталось замечаний: ${issues.length}. Откройте их список выше.`
                      : "Публикация не отправляет данные студентам."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setScreen("imports")}>
                <ArrowLeft />К списку
              </Button>
              {editable && (
                <Button
                  disabled={!canPublish}
                  className="rounded-lg shadow-none"
                  onClick={() => setPublishing(true)}
                >
                  Публикация · демо
                  <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
      {upload && (
        <ScheduleUpload
          onClose={() => setUpload(false)}
          onCreate={createUpload}
        />
      )}
      <Dialog
        open={Boolean(deletingDraft)}
        onOpenChange={(open) => {
          if (!open) setDeletingDraft(null);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Удалить черновик?</DialogTitle>
            <DialogDescription>
              «{deletingDraft?.filename}»: будут удалены все занятия этого
              черновика ({deletingDraft?.lessons.length}). Другие расписания и
              исходный файл на компьютере останутся. Это действие нельзя
              отменить в текущей сессии.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingDraft(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={deleteDraft}>
              Удалить черновик
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {editing && (
        <ScheduleLessonEditor
          lesson={editing}
          onClose={() => setEditing(null)}
          onSave={saveLesson}
        />
      )}
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Удалить занятие из черновика?</DialogTitle>
            <DialogDescription>
              «{deleting?.subject}» будет удалено только из текущего черновика.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                updateLessons(
                  selected.lessons.filter((l) => l.id !== deleting?.id),
                );
                setDeleting(null);
                setNotice("Занятие удалено из черновика.");
              }}
            >
              Удалить занятие
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={publishing} onOpenChange={setPublishing}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Проверить сценарий публикации?</DialogTitle>
            <DialogDescription>
              Изменится только статус расписания в этом интерфейсе. Данные не
              попадут в БД или расписание студентов.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-gray-50 p-4 text-sm leading-7">
            {selected.year} · {selected.course} курс · {selected.semester}{" "}
            семестр
            <br />
            {selected.lessons.length} занятий · {groups.length} групп
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPublishing(false)}>
              Отмена
            </Button>
            <Button
              disabled={!canPublish}
              onClick={() => {
                setRecords((current) => publishDemo(current, selected.id));
                setPublishing(false);
                setNotice(
                  "Демонстрация завершена: статус расписания изменён. На стороне студентов ничего не изменилось.",
                );
              }}
            >
              Подтвердить демопубликацию
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={source} onOpenChange={setSource}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl bg-white sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Исходный PDF</DialogTitle>
            <DialogDescription className="break-all">
              {selected.filename} · локальный просмотр без отправки файла
            </DialogDescription>
          </DialogHeader>
          {source && selected.sourceUrl && (
            <>
              <iframe
                title="Исходное расписание PDF"
                src={selected.sourceUrl}
                className="h-[65dvh] w-full rounded-lg border border-gray-200"
              />
              <a
                href={selected.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 underline"
              >
                Открыть PDF в отдельной вкладке
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
