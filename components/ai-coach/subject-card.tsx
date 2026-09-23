"use client";

import { cn } from "@/lib/utils";
import { subjectDotColor, type ApiSubject } from "@/lib/ai-coach";

type Props = {
  subject: ApiSubject;
  isSelected: boolean;
  onToggle: (subject: ApiSubject) => void;
};

export default function SubjectCard({ subject, isSelected, onToggle }: Props) {
  const dotColor = subjectDotColor(subject.id);
  const hasQuestions = subject.availableQuestions > 0;

  const diffParts: string[] = [];
  if (subject.easyCount > 0) diffParts.push(`${subject.easyCount} лёгк.`);
  if (subject.mediumCount > 0) diffParts.push(`${subject.mediumCount} средн.`);
  if (subject.hardCount > 0) diffParts.push(`${subject.hardCount} сл.`);

  return (
    <button
      type="button"
      onClick={() => onToggle(subject)}
      disabled={!hasQuestions}
      className={cn(
        "w-full text-left rounded-2xl border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        isSelected
          ? "border-blue-300 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm",
        !hasQuestions && "cursor-not-allowed opacity-40",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className={cn("mt-[5px] size-2 shrink-0 rounded-full", dotColor)}
        />
        <span className="text-sm font-semibold leading-snug text-gray-900">
          {subject.name}
        </span>
      </div>

      {hasQuestions ? (
        <p className="mt-1.5 pl-4 text-[11px] text-gray-500">
          {diffParts.join(" · ")}
        </p>
      ) : (
        <p className="mt-1.5 pl-4 text-[11px] text-gray-400">Нет вопросов</p>
      )}
    </button>
  );
}
