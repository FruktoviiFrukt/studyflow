"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiCoachSubject } from "@/lib/ai-coach";

type SubjectCardProps = {
  subject: AiCoachSubject;
  selected: boolean;
  onSelect: (id: string) => void;
};

export default function SubjectCard({
  subject,
  selected,
  onSelect,
}: SubjectCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(subject.id)}
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30",
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-blue-600 text-white">
          <Check aria-hidden="true" className="size-3.5" />
        </span>
      )}
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn("size-2.5 shrink-0 rounded-full", subject.dot)}
        />
        <span className="pr-6 text-sm font-semibold text-gray-900">
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
