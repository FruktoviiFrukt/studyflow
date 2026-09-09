"use client";

import { QuizResult } from "@/types/quiz";
import {
  Trophy,
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Target,
  ArrowLeft,
} from "lucide-react";

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
  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-8 bg-card rounded-xl border shadow-sm">
      {/* Заголовок */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-primary/10 text-primary rounded-full mb-2">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Результаты теста</h1>
        <p className="text-muted-foreground text-sm">
          Отличная работа! Вот подробный разбор ваших результатов.
        </p>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-secondary/50 rounded-lg border text-center space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">
            Итоговый балл
          </span>
          <p className="text-2xl font-bold text-foreground">
            {result.percentage}%
          </p>
        </div>

        <div className="p-4 bg-secondary/50 rounded-lg border text-center space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">
            Опыт (XP)
          </span>
          <p className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
            <Zap className="w-5 h-5 fill-amber-500" />+{result.xpEarned}
          </p>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center space-y-1">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
            Правильно
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-5 h-5" />
            {result.correctCount}
          </p>
        </div>

        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-center space-y-1">
          <span className="text-xs text-rose-600 dark:text-rose-400 uppercase font-semibold">
            Ошибок
          </span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1">
            <XCircle className="w-5 h-5" />
            {result.incorrectCount}
          </p>
        </div>
      </div>

      {/* Аналитика тем */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-3 p-4 rounded-lg border bg-background">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Сильные темы
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.strongTopics.length > 0 ? (
              result.strongTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20"
                >
                  {topic}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">
                Сильные темы пока не определены
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-lg border bg-background">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Target className="w-4 h-4" />
            Темы для повторения
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.weakTopics.length > 0 ? (
              result.weakTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md border border-rose-500/20"
                >
                  {topic}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">
                Ошибок нет! Отличный результат.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
        <button
          onClick={onBackToCoach}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад в AI Coach
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onRetry}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent"
          >
            <RotateCcw className="w-4 h-4" />
            Пройти заново
          </button>

          <button
            onClick={onPracticeWeak}
            disabled={result.weakTopics.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Target className="w-4 h-4" />
            Проработать слабые темы
          </button>
        </div>
      </div>
    </div>
  );
}
