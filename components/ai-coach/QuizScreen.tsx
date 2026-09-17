"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, LogOut, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz";

interface QuizScreenProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedOptionId?: string;
  isSubmitted?: boolean;
  onSelectOption: (optionId: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
  onExit: () => void;
}

export function QuizScreen({
  question,
  currentIndex,
  totalQuestions,
  selectedOptionId,
  isSubmitted = false,
  onSelectOption,
  onNext,
  onPrev,
  onFinish,
  onExit,
}: QuizScreenProps) {
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isTrueFalse = question.type === "true-false";

  return (
    <>
      <Card className="w-full max-w-2xl rounded-2xl border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Шапка */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExitDialogOpen(true)}
              aria-label="Покинуть квиз"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
            >
              <LogOut aria-hidden="true" className="size-3.5" />
              Выйти
            </button>

            <span className="flex-1 text-center text-sm text-gray-500">
              Вопрос{" "}
              <span className="font-semibold text-gray-900">
                {currentIndex + 1}
              </span>{" "}
              из{" "}
              <span className="font-semibold text-gray-900">
                {totalQuestions}
              </span>
            </span>

            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {question.topic}
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Текст вопроса */}
        <h2 className="mb-6 text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
          {question.text}
        </h2>

        {/* Варианты ответов */}
        <div className={cn("grid gap-3", isTrueFalse && "sm:grid-cols-2")}>
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.id === question.correctAnswerId;
            const showCorrect = isSubmitted && isCorrect;
            const showWrong = isSubmitted && isSelected && !isCorrect;

            return (
              <button
                key={option.id}
                type="button"
                disabled={isSubmitted}
                onClick={() => onSelectOption(option.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all",
                  isSubmitted
                    ? showCorrect
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                      : showWrong
                        ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500"
                        : "border-gray-200 bg-gray-50 text-gray-400"
                    : isSelected
                      ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isTrueFalse && "text-base",
                    isSubmitted
                      ? showCorrect
                        ? "text-emerald-800"
                        : showWrong
                          ? "text-rose-800"
                          : "text-gray-400"
                      : isSelected
                        ? "text-blue-900"
                        : "text-gray-700",
                  )}
                >
                  {option.text}
                </span>

                {!isSubmitted && isSelected && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check aria-hidden="true" className="size-3" />
                  </span>
                )}
                {isSubmitted && showCorrect && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check aria-hidden="true" className="size-3" />
                  </span>
                )}
                {isSubmitted && showWrong && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                    <X aria-hidden="true" className="size-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Навигация */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={currentIndex === 0}
          >
            <ArrowLeft aria-hidden="true" />
            Назад
          </Button>

          {isLastQuestion ? (
            <Button onClick={onFinish} disabled={!selectedOptionId}>
              Завершить тест
            </Button>
          ) : (
            <Button onClick={onNext} disabled={!selectedOptionId}>
              Далее
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
      </Card>

      {/* Диалог подтверждения выхода */}
      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-gray-200 bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Прервать квиз?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Прогресс текущей попытки будет потерян. Вы сможете начать заново в
              любое время.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setExitDialogOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Продолжить квиз
            </Button>
            <Button
              variant="destructive"
              onClick={onExit}
              className="flex-1 sm:flex-none"
            >
              <LogOut aria-hidden="true" />
              Выйти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
