"use client";

import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { subjectDotColor, type ApiSubject } from "@/lib/ai-coach";
import SubjectCard from "./subject-card";

type SubjectSelectProps = {
  subjects: ApiSubject[];
  loading: boolean;
  selectedSubjectIds: string[];
  onToggle: (id: string) => void;
};

export default function SubjectSelect({
  subjects,
  loading,
  selectedSubjectIds,
  onToggle,
}: SubjectSelectProps) {
  return (
    <Card className="rounded-2xl border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold sm:text-lg">Предметы</h3>
      <p className="mt-1 text-xs text-gray-500">
        Необязательно — Gemini определит предмет автоматически. Выберите, чтобы
        видеть темы и сохранённые квизы по предмету.
      </p>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Загрузка предметов…
        </div>
      )}

      {!loading && subjects.length === 0 && (
        <p className="mt-4 text-xs text-gray-400">
          Реестр предметов пуст — обратитесь к администратору.
        </p>
      )}

      {!loading && subjects.length > 0 && (
        <div
          role="group"
          aria-label="Выбор предметов"
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              dotColor={subjectDotColor(subject.id)}
              selected={selectedSubjectIds.includes(subject.id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
