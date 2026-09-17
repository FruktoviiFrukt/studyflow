"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Play, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import NotesInput from "./notes-input";
import SubjectSelect from "./subject-select";
import GenerationSettings from "./generation-settings";
import GeminiKeyCard from "./GeminiKeyCard";
import { QuizScreen } from "./QuizScreen";
import { ResultsScreen } from "./ResultsScreen";
import type { Question, QuizResult } from "@/types/quiz";
import {
  getGenerationReadiness,
  type ApiSubject,
  type Difficulty,
} from "@/lib/ai-coach";
import { cn } from "@/lib/utils";

type Tab = "generate" | "database";
type Step = "setup" | "quiz" | "results";

type ApiOption = { id: string; text: string; isCorrect: boolean };
type ApiQuestion = {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: ApiOption[];
};
type GenerateResponse = {
  topicName: string;
  subjectId: string;
  questions: ApiQuestion[];
  totalSaved: number;
  skippedAsDuplicates: number;
};
type QuizApiQuestion = ApiQuestion & { topicName: string };
type QuizApiResponse = { questions: QuizApiQuestion[] };

function mapQuestions(response: GenerateResponse): Question[] {
  return response.questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: (q.type === "MULTIPLE_CHOICE"
      ? "multiple-choice"
      : "true-false") as Question["type"],
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    correctAnswerId: q.options.find((o) => o.isCorrect)?.id ?? "",
    topic: response.topicName,
    subjectId: response.subjectId,
    difficulty: q.difficulty.toLowerCase() as Difficulty,
  }));
}

function mapExistingQuestions(apiQuestions: QuizApiQuestion[]): Question[] {
  return apiQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: (q.type === "MULTIPLE_CHOICE"
      ? "multiple-choice"
      : "true-false") as Question["type"],
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    correctAnswerId: q.options.find((o) => o.isCorrect)?.id ?? "",
    topic: q.topicName,
    subjectId: "",
    difficulty: q.difficulty.toLowerCase() as Difficulty,
  }));
}

export default function AiCoach() {
  const [keyLinked, setKeyLinked] = useState<boolean | null>(null);
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [step, setStep] = useState<Step>("setup");
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  // Inputs
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [noteText, setNoteText] = useState("");

  // Subject/topic selection
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(
    new Set(),
  );
  const [openAccordionSubjectId, setOpenAccordionSubjectId] = useState<
    string | null
  >(null);

  // Settings
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [weakQuestions, setWeakQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    fetch("/api/ai-coach/api-key")
      .then((r) => r.json())
      .then((d: { linked: boolean }) => setKeyLinked(d.linked))
      .catch(() => setKeyLinked(false));
  }, []);

  useEffect(() => {
    fetch("/api/ai-coach/subjects")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: ApiSubject[]) => {
        setSubjects(data);
        setSubjectsLoading(false);
      })
      .catch(() => setSubjectsLoading(false));
  }, []);

  const hasNotes = noteText.trim().length > 0 || attachedFiles.length > 0;
  const { canGenerate } = getGenerationReadiness({ hasNotes, questionCount });
  const canAssemble = selectedTopicIds.size > 0;
  const currentQuestion = quizQuestions[currentIndex];
  const canStart = activeTab === "generate" ? canGenerate : canAssemble;

  // ---------------------------------------------------------------------------
  // File handlers
  // ---------------------------------------------------------------------------

  function handleAddFile(file: File) {
    setAttachedFiles((prev) =>
      prev.some((f) => f.name === file.name) ? prev : [...prev, file],
    );
  }
  function handleRemoveFile(name: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name));
  }

  // ---------------------------------------------------------------------------
  // Subject/topic handlers
  // ---------------------------------------------------------------------------

  function handleToggleSubject(subject: ApiSubject) {
    const wasSelected = selectedSubjectIds.has(subject.id);

    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (wasSelected) next.delete(subject.id);
      else next.add(subject.id);
      return next;
    });

    // Auto-select / deselect all topics with questions
    const topicIds = subject.topics
      .filter((t) => t.questionCount > 0)
      .map((t) => t.id);

    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      topicIds.forEach((id) => (wasSelected ? next.delete(id) : next.add(id)));
      return next;
    });

    // Close accordion when subject is removed
    if (wasSelected) {
      setOpenAccordionSubjectId((prev) => (prev === subject.id ? null : prev));
    }
  }

  function handleToggleTopic(topicId: string) {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  function handleOpenAccordion(subjectId: string | null) {
    setOpenAccordionSubjectId((prev) =>
      prev === subjectId ? null : subjectId,
    );
  }

  // ---------------------------------------------------------------------------
  // Generation / assembly
  // ---------------------------------------------------------------------------

  async function handleGenerate() {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const fd = new FormData();
      fd.append("text", noteText);
      fd.append("questionCount", String(questionCount));
      fd.append("difficulty", difficulty);
      for (const file of attachedFiles) fd.append("file", file);

      const res = await fetch("/api/ai-coach/generate", {
        method: "POST",
        body: fd,
      });

      if (res.status === 402) {
        setKeyLinked(false);
        return;
      }

      if (!res.ok) {
        let msg = "Ошибка при генерации вопросов";
        try {
          const data = (await res.json()) as {
            message?: string;
            reason?: string;
          };
          if (data.message === "INVALID_API_KEY") {
            setKeyError(
              "Ключ Gemini отклонён — удалите его и добавьте действующий",
            );
            setKeyLinked(false);
            return;
          }
          msg = data.reason ?? data.message ?? msg;
        } catch {}
        setGenerationError(msg);
        return;
      }

      const data = (await res.json()) as GenerateResponse;
      const questions = mapQuestions(data);
      if (questions.length === 0) {
        setGenerationError(
          "Все вопросы оказались дублями. Попробуйте другой материал.",
        );
        return;
      }
      setQuizQuestions(questions);
      setWeakQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setStep("quiz");
    } catch {
      setGenerationError("Не удалось подключиться к серверу");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAssemble() {
    if (!canAssemble || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const res = await fetch("/api/ai-coach/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicIds: [...selectedTopicIds],
          difficulty,
          count: questionCount,
        }),
      });

      if (!res.ok) {
        let msg = "Не удалось загрузить вопросы";
        try {
          msg = ((await res.json()) as { message?: string }).message ?? msg;
        } catch {}
        setGenerationError(msg);
        return;
      }

      const data = (await res.json()) as QuizApiResponse;
      const questions = mapExistingQuestions(data.questions);
      if (questions.length === 0) {
        setGenerationError(
          "Нет вопросов для выбранной сложности — попробуйте изменить настройки",
        );
        return;
      }
      setQuizQuestions(questions);
      setWeakQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setStep("quiz");
    } catch {
      setGenerationError("Не удалось подключиться к серверу");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleStart() {
    if (activeTab === "generate") handleGenerate();
    else handleAssemble();
  }

  // ---------------------------------------------------------------------------
  // Quiz handlers
  // ---------------------------------------------------------------------------

  function handleSelectOption(optionId: string) {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  }
  function handleNext() {
    if (currentIndex < quizQuestions.length - 1) setCurrentIndex((i) => i + 1);
  }
  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }

  function handleFinish() {
    let correctCount = 0;
    const strongSet = new Set<string>();
    const weakSet = new Set<string>();
    const wrongQs: Question[] = [];

    quizQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected === q.correctAnswerId) {
        correctCount += 1;
        strongSet.add(q.topic);
      } else {
        weakSet.add(q.topic);
        wrongQs.push(q);
      }
    });

    setWeakQuestions(wrongQs);

    const incorrectCount = quizQuestions.length - correctCount;
    const percentage = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizResult({
      totalQuestions: quizQuestions.length,
      correctCount,
      incorrectCount,
      finalScore: percentage,
      percentage,
      xpEarned: correctCount * 50,
      strongTopics: Array.from(strongSet).filter((t) => !weakSet.has(t)),
      weakTopics: Array.from(weakSet),
    });
    setStep("results");
  }

  function handleRetry() {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setQuizResult(null);
    setGenerationError(null);
    setStep("quiz");
  }

  function handlePracticeWeak() {
    if (weakQuestions.length === 0) return;
    setQuizQuestions(weakQuestions);
    setWeakQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setQuizResult(null);
    setGenerationError(null);
    setStep("quiz");
  }

  function resetToSetup() {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setQuizResult(null);
    setWeakQuestions([]);
    setGenerationError(null);
    setStep("setup");
  }

  // ---------------------------------------------------------------------------
  // Render: quiz / results
  // ---------------------------------------------------------------------------

  if (step === "quiz" && currentQuestion) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-2 py-8">
        <QuizScreen
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={quizQuestions.length}
          selectedOptionId={selectedAnswers[currentQuestion.id]}
          onSelectOption={handleSelectOption}
          onNext={handleNext}
          onPrev={handlePrev}
          onFinish={handleFinish}
          onExit={resetToSetup}
        />
      </div>
    );
  }
  if (step === "results" && quizResult) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-2 py-8">
        <ResultsScreen
          result={quizResult}
          onRetry={handleRetry}
          onPracticeWeak={handlePracticeWeak}
          onBackToCoach={resetToSetup}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: setup
  // ---------------------------------------------------------------------------

  const header = (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
        Подготовка к экзамену
      </p>
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" className="size-6 text-blue-600" />
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          AI Exam Coach
        </h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
        Сгенерируйте тест из материала или выберите темы из готовой базы.
      </p>
    </div>
  );

  if (keyLinked === false) {
    return (
      <div className="mx-auto max-w-360 space-y-5">
        {header}
        <GeminiKeyCard
          onLinked={() => {
            setKeyLinked(true);
            setKeyError(null);
          }}
          errorMessage={keyError ?? undefined}
        />
      </div>
    );
  }

  const tabs = (
    <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5">
      {(
        [
          { id: "generate", label: "ИИ-Генерация" },
          { id: "database", label: "База тестов" },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => {
            setActiveTab(tab.id);
            setGenerationError(null);
          }}
          className={cn(
            "flex-1 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const statusLine =
    activeTab === "database" ? (
      <p className="text-xs text-gray-500">
        {canAssemble
          ? `${selectedTopicIds.size} ${selectedTopicIds.size === 1 ? "тема" : selectedTopicIds.size < 5 ? "темы" : "тем"} выбрано`
          : "Выберите хотя бы одну тему"}
      </p>
    ) : (
      <p className="text-xs text-gray-500">
        {attachedFiles.length > 0 && noteText.trim().length > 0
          ? `${attachedFiles.length} файл(а) + ${noteText.trim().length} симв.`
          : attachedFiles.length > 0
            ? `${attachedFiles.length} файл(а) прикреплено`
            : noteText.trim().length > 0
              ? `${noteText.trim().length} символов`
              : "Введите текст или прикрепите файл"}
      </p>
    );

  return (
    <div className="mx-auto max-w-360 space-y-5">
      {header}
      {tabs}

      <Card className="rounded-2xl border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        {activeTab === "generate" ? (
          <>
            <h3 className="mb-3 text-base font-semibold sm:text-lg">
              ИИ-Генерация квиза по материалу
            </h3>
            <NotesInput
              attachedFiles={attachedFiles}
              onAddFile={handleAddFile}
              onRemoveFile={handleRemoveFile}
              text={noteText}
              onTextChange={setNoteText}
            />
          </>
        ) : (
          <>
            <h3 className="mb-1 text-base font-semibold sm:text-lg">
              Готовая база вопросов
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              Выберите предметы — темы добавятся автоматически. Кликните на чип
              для уточнения.
            </p>
            <SubjectSelect
              subjects={subjects}
              loading={subjectsLoading}
              selectedSubjectIds={selectedSubjectIds}
              selectedTopicIds={selectedTopicIds}
              openAccordionSubjectId={openAccordionSubjectId}
              onToggleSubject={handleToggleSubject}
              onToggleTopic={handleToggleTopic}
              onOpenAccordion={handleOpenAccordion}
            />
          </>
        )}
      </Card>

      <GenerationSettings
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
      />

      {generationError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {generationError}
        </div>
      )}

      <div className="flex items-center justify-between">
        {statusLine}
        <button
          type="button"
          disabled={!canStart || isGenerating}
          onClick={handleStart}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              {activeTab === "generate" ? "Генерация…" : "Загрузка…"}
            </>
          ) : (
            <>
              <Play aria-hidden="true" className="size-4" />
              Сформировать тест
            </>
          )}
        </button>
      </div>
    </div>
  );
}
