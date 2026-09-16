"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectDotColor, type ApiSubject } from "@/lib/ai-coach";

type SubjectTopicsPanelProps = {
  subject: ApiSubject;
};

export default function SubjectTopicsPanel({
  subject,
}: SubjectTopicsPanelProps) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(
    new Set(),
  );

  const filteredTopics = subject.topics.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const allFilteredSelected =
    filteredTopics.length > 0 &&
    filteredTopics.every((t) => selectedTopicIds.has(t.id));

  function toggleTopic(id: string) {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllTopics() {
    setSelectedTopicIds(new Set(filteredTopics.map((t) => t.id)));
  }

  function resetTopics() {
    setSelectedTopicIds(new Set());
    setSearch("");
  }

  const dotColor = subjectDotColor(subject.id);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 sm:px-5"
        aria-expanded={open}
      >
        <span
          aria-hidden="true"
          className={cn("size-2.5 shrink-0 rounded-full", dotColor)}
        />
        <span className="flex-1 text-left text-sm font-semibold text-gray-900">
          {subject.name}
        </span>
        {selectedTopicIds.size > 0 ? (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {selectedTopicIds.size} выбрано
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
            {subject.topics.length} тем
          </span>
        )}
        {open ? (
          <ChevronUp
            aria-hidden="true"
            className="size-4 shrink-0 text-gray-400"
          />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-gray-400"
          />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 sm:px-5">
          {subject.topics.length === 0 ? (
            <p className="text-xs text-gray-400">
              Темы появятся после первой генерации квизов по этому предмету.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-40 flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Поиск по темам…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={allFilteredSelected ? resetTopics : selectAllTopics}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900"
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded border-2 transition-colors",
                      allFilteredSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300 bg-white",
                    )}
                  >
                    {allFilteredSelected && (
                      <Check
                        aria-hidden="true"
                        className="size-2.5 text-white"
                      />
                    )}
                  </span>
                  Все
                </button>
              </div>

              {filteredTopics.length > 0 && (
                <div className="mt-3 max-h-44 overflow-y-auto pr-1">
                  <div className="flex flex-wrap gap-2">
                    {filteredTopics.map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggleTopic(topic.id)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                          selectedTopicIds.has(topic.id)
                            ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600",
                        )}
                      >
                        {topic.name}
                        {topic.questionCount > 0 && (
                          <span className="ml-1.5 text-xs text-gray-400">
                            {topic.questionCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredTopics.length === 0 && search && (
                <p className="mt-3 text-xs text-gray-400">
                  Ничего не найдено по запросу «{search}»
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
