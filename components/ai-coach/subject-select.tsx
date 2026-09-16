"use client";

import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { aiCoachSubjects } from "@/lib/ai-coach";
import SubjectCard from "./subject-card";

type SubjectSelectProps = {
  selectedSubjectIds: string[];
  onToggle: (id: string) => void;
};

export default function SubjectSelect({
  selectedSubjectIds,
  onToggle,
}: SubjectSelectProps) {
  return (
    <Card className="rounded-2xl border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold sm:text-lg">Выберите предметы</h3>
      <p className="mt-1 text-xs text-gray-500">
        Вопросы будут сгенерированы по выбранным предметам. Можно выбрать
        несколько.
      </p>

      <div
        role="group"
        aria-label="Выбор предметов"
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {aiCoachSubjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            selected={selectedSubjectIds.includes(subject.id)}
            onToggle={onToggle}
          />
        ))}

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
        >
          <Plus aria-hidden="true" className="size-4" />
          Добавить предмет из БД
        </button>
      </div>
    </Card>
  );
}
