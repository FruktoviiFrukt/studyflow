"use client";

import { Question } from "@/types/quiz";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

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
}: QuizScreenProps) {
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-8 bg-card rounded-xl border shadow-sm">
      {/* Шапка */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
          <span>
            Вопрос{" "}
            <strong className="text-foreground">{currentIndex + 1}</strong> из{" "}
            <strong className="text-foreground">{totalQuestions}</strong>
          </span>
          <span className="px-2.5 py-1 bg-secondary rounded-full text-xs font-semibold text-secondary-foreground">
            {question.topic}
          </span>
        </div>

        {/* Прогресс-бар */}
        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Текст вопроса */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
          {question.text}
        </h2>
      </div>

      {/* Варианты ответов */}
      <div className="grid gap-3">
        {(question?.options || []).map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.id === question.correctAnswerId;
          const isWrongSelection = isSubmitted && isSelected && !isCorrect;
          const isCorrectSelection = isSubmitted && isCorrect;

          let buttonStyles =
            "border-border bg-background hover:bg-accent hover:text-accent-foreground";

          if (isSubmitted) {
            if (isCorrectSelection) {
              buttonStyles =
                "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500";
            } else if (isWrongSelection) {
              buttonStyles =
                "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold ring-1 ring-rose-500";
            }
          } else if (isSelected) {
            buttonStyles =
              "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary";
          }

          return (
            <button
              key={option.id}
              disabled={isSubmitted}
              onClick={() => onSelectOption(option.id)}
              className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between gap-3 text-base ${buttonStyles}`}
            >
              <span>{option.text}</span>

              <div className="shrink-0">
                {isSubmitted && isCorrectSelection && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                {isSubmitted && isWrongSelection && (
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                )}
                {!isSubmitted && isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Навигация */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        {isLastQuestion ? (
          <button
            onClick={onFinish}
            disabled={!selectedOptionId}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Завершить тест
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!selectedOptionId}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Далее
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
