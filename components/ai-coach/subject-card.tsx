"use client";

import { cn } from "@/lib/utils";
import type { AiCoachSubject } from "@/lib/ai-coach";

type SubjectCardProps = {
  subject: AiCoachSubject;
  selected: boolean;
  onToggle: (id: string) => void;
};

export default function SubjectCard({
  subject,
  selected,
  onToggle,
}: SubjectCardProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={() => onToggle(subject.id)}
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn("size-2.5 shrink-0 rounded-full", subject.dot)}
        />
        <span className="text-sm font-semibold text-gray-900">
          {subject.name}
        </span>
      </span>
      <span className="text-xs text-gray-500">
        Доступно вопросов:{" "}
        <span className="font-medium text-gray-700">
          {subject.availableQuestions}
        </span>
      </span>
    </button>
  );
}
