"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { streamOf, type TemplateResponse } from "@/lib/global-template-view";
import GlobalTimetable from "./global-timetable";

export default function GlobalSchedule() {
  const [data, setData] = useState<TemplateResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [stream, setStream] = useState("all");
  const [parity, setParity] = useState<"ODD" | "EVEN">("ODD");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch("/api/schedule/global/template", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.message || "Не удалось загрузить расписание.");
        if (!Array.isArray(body.groups) || !Array.isArray(body.days))
          throw new Error("Некорректный ответ сервера.");
        if (active) setData(body);
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : "Ошибка загрузки.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  const streams = [
    ...new Set(data?.groups.map((group) => streamOf(group.name)) ?? []),
  ];
  const groups =
    data?.groups.filter(
      (group) => stream === "all" || streamOf(group.name) === stream,
    ) ?? [];

  return (
    <div className="mx-auto min-w-0 max-w-[1600px] space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          Все группы
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Глобальное расписание
        </h2>
        {data?.academicYear && (
          <p className="mt-2 text-sm text-gray-500">
            Учебный год {data.academicYear} · {data.semester} семестр
          </p>
        )}
      </div>
      {loading ? (
        <Card role="status" className="rounded-2xl border-gray-200">
          <LoadingIndicator text="Загружаем глобальное расписание…" />
        </Card>
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setError("");
            setLoading(true);
            setAttempt((value) => value + 1);
          }}
        />
      ) : !data?.groups.length ? (
        <Card className="rounded-2xl border-gray-200 p-10 text-center">
          <h3 className="font-semibold">
            Глобальное расписание ещё не опубликовано
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            После публикации группы и занятия появятся здесь.
          </p>
        </Card>
      ) : (
        <Card className="min-w-0 overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 p-4 sm:p-5">
            <div className="grid gap-2 text-sm font-medium text-gray-600">
              <span>Направление</span>
              <Select value={stream} onValueChange={setStream}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все направления</SelectItem>
                  {streams.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              role="group"
              aria-label="Чётность недели"
              className="flex gap-2"
            >
              {(
                [
                  ["ODD", "Нечётная"],
                  ["EVEN", "Чётная"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={parity === value ? "default" : "outline"}
                  aria-pressed={parity === value}
                  onClick={() => setParity(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <GlobalTimetable data={data} groups={groups} parity={parity} />
          <p className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            Общие занятия соседних групп объединены. Таблица показывает
            повторяющийся недельный шаблон.
          </p>
        </Card>
      )}
    </div>
  );
}
