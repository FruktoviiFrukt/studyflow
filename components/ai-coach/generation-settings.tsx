"use client";

import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
  const countOptions = questionCountOptions.map((count) => ({
    value: count,
    label: String(count),
  }));

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
          <SegmentedControl
            options={countOptions}
            value={questionCount}
            onChange={onQuestionCountChange}
            ariaLabel="Количество вопросов"
          />
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
