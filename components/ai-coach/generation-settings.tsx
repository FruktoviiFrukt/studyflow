"use client";

import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import {
  difficultyOptions,
  questionCountOptions,
  questionTypeOptions,
  type Difficulty,
  type QuestionType,
} from "@/lib/ai-coach";

type GenerationSettingsProps = {
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  questionType: QuestionType;
  onQuestionTypeChange: (type: QuestionType) => void;
};

export default function GenerationSettings({
  questionCount,
  onQuestionCountChange,
  difficulty,
  onDifficultyChange,
  questionType,
  onQuestionTypeChange,
}: GenerationSettingsProps) {
  function handleCountInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 10) {
      onQuestionCountChange(Math.min(val, 100));
    }
  }

  return (
    <Card className="rounded-2xl border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold sm:text-lg">
        Настройки генерации
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Выберите количество вопросов, уровень сложности и формат ответа.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-gray-700">
            Количество вопросов
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min="10"
              max="100"
              value={questionCount}
              onChange={handleCountInput}
              aria-label="Количество вопросов"
              className="w-20 rounded-lg border border-gray-200 bg-white py-1.5 px-3 text-center text-sm tabular-nums shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <div className="flex gap-1.5">
              {questionCountOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onQuestionCountChange(n)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    questionCount === n
                      ? "border-blue-500 bg-blue-50 font-medium text-blue-600"
                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-700">Сложность</p>
          <SegmentedControl
            options={difficultyOptions}
            value={difficulty}
            onChange={onDifficultyChange}
            ariaLabel="Уровень сложности"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-700">Тип вопросов</p>
          <SegmentedControl
            options={questionTypeOptions}
            value={questionType}
            onChange={onQuestionTypeChange}
            ariaLabel="Тип вопросов"
          />
        </div>
      </div>
    </Card>
  );
}
