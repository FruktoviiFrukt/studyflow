"use client";

import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizResult } from "@/types/quiz";

interface ResultsScreenProps {
  result: QuizResult;
  onRetry: () => void;
  onPracticeWeak: () => void;
  onBackToCoach: () => void;
}

export function ResultsScreen({
  result,
  onRetry,
  onPracticeWeak,
  onBackToCoach,
}: ResultsScreenProps) {
  const scoreColor =
    result.percentage >= 80
      ? "text-emerald-600"
      : result.percentage >= 50
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <Card className="w-full max-w-2xl rounded-2xl border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Заголовок */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-blue-50">
          <Trophy aria-hidden="true" className="size-7 text-blue-600" />
        </span>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Результаты теста
        </h1>
        <p className="text-sm text-gray-500">
          Вот подробный разбор ваших ответов.
        </p>
      </div>

      {/* Итоговый счёт */}
      <div className="mb-6 flex flex-col items-center">
        <span className={cn("text-6xl font-bold tabular-nums", scoreColor)}>
          {result.percentage}%
        </span>
        <span className="mt-1 text-sm text-gray-500">
          {result.correctCount} из {result.totalQuestions} правильных ответов
        </span>
      </div>

      {/* Метрики */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Zap
            aria-hidden="true"
            className="size-5 fill-amber-500 text-amber-500"
          />
          <span className="text-xl font-bold text-amber-600 tabular-nums">
            +{result.xpEarned}
          </span>
          <span className="text-xs font-medium text-amber-700">Опыт (XP)</span>
        </div>

        <div className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <CheckCircle2
            aria-hidden="true"
            className="size-5 text-emerald-500"
          />
          <span className="text-xl font-bold text-emerald-600 tabular-nums">
            {result.correctCount}
          </span>
          <span className="text-xs font-medium text-emerald-700">
            Правильно
          </span>
        </div>

        <div className="col-span-2 flex flex-col items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 p-3 sm:col-span-1">
          <XCircle aria-hidden="true" className="size-5 text-rose-500" />
          <span className="text-xl font-bold text-rose-600 tabular-nums">
            {result.incorrectCount}
          </span>
          <span className="text-xs font-medium text-rose-700">Ошибок</span>
        </div>
      </div>

      {/* Аналитика тем */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Сильные темы
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {result.strongTopics.length > 0 ? (
              result.strongTopics.map((topic, i) => (
                <span
                  key={i}
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  {topic}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">
                Сильные темы не определены
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-700">
            <Target aria-hidden="true" className="size-4" />
            Темы для повторения
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {result.weakTopics.length > 0 ? (
              result.weakTopics.map((topic, i) => (
                <span
                  key={i}
                  className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"
                >
                  {topic}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">
                Ошибок нет! Отличный результат.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={onBackToCoach}>
          <ArrowLeft aria-hidden="true" />
          Назад в AI Coach
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden="true" />
            Пройти заново
          </Button>
          <Button
            onClick={onPracticeWeak}
            disabled={result.weakTopics.length === 0}
          >
            <Target aria-hidden="true" />
            Проработать слабые темы
          </Button>
        </div>
      </div>
    </Card>
  );
}
