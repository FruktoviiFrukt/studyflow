"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { subjectDotColor, type ApiSubject } from "@/lib/ai-coach";
import SubjectCard from "./subject-card";

type Props = {
  subjects: ApiSubject[];
  loading: boolean;
  selectedSubjectIds: Set<string>;
  selectedTopicIds: Set<string>;
  openAccordionSubjectId: string | null;
  onToggleSubject: (subject: ApiSubject) => void;
  onToggleTopic: (topicId: string) => void;
  onOpenAccordion: (subjectId: string | null) => void;
};

export default function SubjectSelect({
  subjects,
  loading,
  selectedSubjectIds,
  selectedTopicIds,
  openAccordionSubjectId,
  onToggleSubject,
  onToggleTopic,
  onOpenAccordion,
}: Props) {
  const [topicSearch, setTopicSearch] = useState("");
  const [prevAccordionId, setPrevAccordionId] = useState(
    openAccordionSubjectId,
  );

  // Reset search when accordion switches to a different subject (derived-state pattern)
  if (prevAccordionId !== openAccordionSubjectId) {
    setPrevAccordionId(openAccordionSubjectId);
    if (topicSearch !== "") setTopicSearch("");
  }

  const selectedSubjects = subjects.filter((s) => selectedSubjectIds.has(s.id));

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Загрузка предметов…
        </div>
      )}

      {!loading && subjects.length === 0 && (
        <p className="text-xs text-gray-400">
          Реестр предметов пуст — обратитесь к администратору.
        </p>
      )}

      {!loading && subjects.length > 0 && (
        <div
          role="group"
          aria-label="Выбор предметов"
          className="ai-subject-scroll grid max-h-[196px] grid-cols-3 gap-2 overflow-y-auto pr-0.5"
        >
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              isSelected={selectedSubjectIds.has(subject.id)}
              onToggle={onToggleSubject}
            />
          ))}
        </div>
      )}

      {/* Selected subjects — full-width strips with per-strip inline accordion */}
      {selectedSubjects.length > 0 && (
        <div className="space-y-1.5 border-t border-gray-100 pt-3">
          {selectedSubjects.map((subject) => {
            const isOpen = openAccordionSubjectId === subject.id;
            const dotColor = subjectDotColor(subject.id);
            const filteredTopics = subject.topics.filter((t) =>
              t.name.toLowerCase().includes(topicSearch.toLowerCase()),
            );

            return (
              <div key={subject.id}>
                {/* Strip row */}
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-xl border px-3 py-2.5 transition-colors",
                    isOpen
                      ? "rounded-b-none border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  {/* Toggle button — takes all available space */}
                  <button
                    type="button"
                    onClick={() => onOpenAccordion(isOpen ? null : subject.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-2.5 shrink-0 rounded-full", dotColor)}
                    />
                    <span className="truncate text-sm font-medium text-gray-800">
                      {subject.name}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "ml-auto size-4 shrink-0 text-gray-400 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {/* Remove button */}
                  <button
                    type="button"
                    aria-label={`Убрать ${subject.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSubject(subject);
                    }}
                    className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </div>

                {/* Accordion drawer — slides open below the strip */}
                <div className={cn("accordion-content", isOpen && "open")}>
                  <div>
                    <div className="rounded-b-xl border border-t-0 border-blue-200 bg-white">
                      {/* Search with icon */}
                      <div className="px-3 pb-2 pt-2.5">
                        <div className="relative">
                          <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                          />
                          <Input
                            placeholder="Поиск тем…"
                            value={topicSearch}
                            onChange={(e) => setTopicSearch(e.target.value)}
                            className="h-8 pl-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Topic list */}
                      {subject.topics.length === 0 ? (
                        <p className="px-3 pb-4 text-xs text-gray-400">
                          Темы появятся после первой генерации.
                        </p>
                      ) : filteredTopics.length === 0 ? (
                        <p className="px-3 pb-4 text-xs text-gray-400">
                          Нет тем по запросу.
                        </p>
                      ) : (
                        <div className="ai-subject-scroll max-h-[200px] overflow-y-auto px-2 pb-2">
                          <div className="space-y-0.5">
                            {filteredTopics.map((topic) => {
                              const checked = selectedTopicIds.has(topic.id);
                              const disabled = topic.questionCount === 0;
                              return (
                                <label
                                  key={topic.id}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                                    checked
                                      ? "border-blue-200 bg-blue-50 text-blue-800"
                                      : "border-transparent bg-gray-50 text-gray-700 hover:border-gray-200 hover:bg-white",
                                    disabled && "cursor-not-allowed opacity-40",
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => onToggleTopic(topic.id)}
                                    className="size-3.5 shrink-0 accent-blue-600"
                                  />
                                  <span className="flex-1 leading-snug">
                                    {topic.name}
                                  </span>
                                  {topic.questionCount > 0 && (
                                    <span className="shrink-0 tabular-nums text-gray-400">
                                      {topic.questionCount}
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
