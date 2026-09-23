"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CatalogSubject,
  CatalogSubjectDetails,
} from "@/lib/subject-catalog";

export function SubjectScheduleSummary({
  schedules,
}: Pick<CatalogSubject, "schedules">) {
  if (!schedules.total)
    return (
      <p className="mt-2 text-xs text-gray-500">Нет связанных расписаний</p>
    );
  if (!schedules.published)
    return (
      <p className="mt-2 text-xs font-medium text-amber-700">
        Только в черновиках · {schedules.drafts}
      </p>
    );
  return (
    <p className="mt-2 text-xs text-gray-500">
      Расписаний: {schedules.total} · опубликовано: {schedules.published}
      {schedules.drafts ? ` · черновиков: ${schedules.drafts}` : ""}
    </p>
  );
}
const kinds = {
  STUDENT: "Студенческое",
  GLOBAL: "Глобальное",
  ASSESSMENT: "Аттестации",
};
const dateLabel = (value: string) => value.split("-").reverse().join(".");

// Mounted with the subject ID as its key: switching cards cannot show stale data.
export default function SubjectSchedules({ subjectId }: { subjectId: string }) {
  const [data, setData] = useState<CatalogSubjectDetails | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/subjects/${encodeURIComponent(subjectId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            body.message || "Не удалось загрузить связи дисциплины.",
          );
        return body as CatalogSubjectDetails;
      })
      .then((body) => {
        if (!controller.signal.aborted) setData(body);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Не удалось загрузить связи дисциплины.",
          );
      });
    return () => controller.abort();
  }, [subjectId, attempt]);
  if (error)
    return (
      <section className="rounded-xl border border-red-100 bg-red-50 p-4">
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => {
            setError("");
            setAttempt((n) => n + 1);
          }}
        >
          Повторить загрузку расписаний
        </Button>
      </section>
    );
  if (!data)
    return (
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-gray-500"
      >
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Загрузка связанных расписаний…
      </p>
    );
  return (
    <section
      aria-label="Связанные расписания"
      className="space-y-3 border-t border-gray-100 pt-4"
    >
      <h3 className="font-semibold">
        Связанные расписания{" "}
        <span className="text-gray-500">({data.relatedSchedules.length})</span>
      </h3>
      {!data.relatedSchedules.length ? (
        <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          Эта дисциплина пока не используется в расписаниях.
        </p>
      ) : (
        <>
          {!data.schedules.published && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Дисциплина встречается только в черновиках. Занятия ещё не
              опубликованы для студентов.
            </p>
          )}
          <p className="text-xs text-gray-500">
            Группы и преподаватели указаны по занятиям этой дисциплины. Период
            относится ко всему расписанию.
          </p>
          {data.relatedSchedules.map((schedule) => (
            <article
              key={schedule.id}
              className="rounded-xl border border-gray-200 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="min-w-0 flex-1 break-words text-sm font-semibold">
                  {schedule.title}
                </h4>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${schedule.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
                >
                  {schedule.status === "PUBLISHED"
                    ? "Опубликовано"
                    : "Черновик"}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {kinds[schedule.kind]} · {schedule.academicYear} ·{" "}
                {schedule.course} курс · {schedule.semester} семестр
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {dateLabel(schedule.validFrom)} — {dateLabel(schedule.validTo)}
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Группы</dt>
                  <dd className="mt-1 break-words">
                    {schedule.groups.join(", ") || "Не указаны"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Преподаватели</dt>
                  <dd className="mt-1 break-words">
                    {schedule.teachers.join("; ") || "Не указаны"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Записей занятий</dt>
                  <dd className="mt-1">{schedule.lessonCount}</dd>
                </div>
              </dl>
            </article>
          ))}
        </>
      )}
    </section>
  );
}
