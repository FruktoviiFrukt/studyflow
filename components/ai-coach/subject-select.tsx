"use client";

import { Card } from "@/components/ui/card";
import { aiCoachSubjects } from "@/lib/ai-coach";
import SubjectCard from "./subject-card";

type SubjectSelectProps = {
  selectedSubjectId: string | null;
  onSelect: (id: string) => void;
};

export default function SubjectSelect({
  selectedSubjectId,
  onSelect,
}: SubjectSelectProps) {
  return (
    <Card className="rounded-2xl border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold sm:text-lg">Выберите предмет</h3>
      <p className="mt-1 text-xs text-gray-500">
        Вопросы будут сгенерированы по материалам выбранного предмета.
      </p>

      <div
        role="radiogroup"
        aria-label="Выбор предмета"
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {aiCoachSubjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            selected={subject.id === selectedSubjectId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </Card>
  );
}
