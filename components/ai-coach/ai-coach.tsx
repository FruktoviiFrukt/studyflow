"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import NotesInput from "./notes-input";
import SubjectSelect from "./subject-select";
import SubjectTopicsPanel from "./subject-topics-panel";
import GenerationSettings from "./generation-settings";
import GenerateButton from "./generate-button";
import GeminiKeyCard from "./GeminiKeyCard";
import { QuizScreen } from "./QuizScreen";
import { ResultsScreen } from "./ResultsScreen";
import { generateMockQuestions } from "@/lib/mockQuiz";
import type { Question, QuizResult } from "@/types/quiz";
import {
  aiCoachSubjects,
  getGenerationReadiness,
  type Difficulty,
  type QuestionType,
} from "@/lib/ai-coach";

type Step = "setup" | "quiz" | "results";

function toQuizQuestionType(
  selected: QuestionType,
): "multiple-choice" | "true-false" | "combined" {
  if (selected === "single") return "multiple-choice";
  return selected;
}

export default function AiCoach() {
  const [keyLinked, setKeyLinked] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>("setup");

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [noteText, setNoteText] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionType, setQuestionType] = useState<QuestionType>("single");
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
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

  const hasNotes = attachedFiles.length > 0 || noteText.trim().length > 0;
  const hasSubject = selectedSubjectIds.length > 0;
  const allSubjectsHaveTopics =
    selectedSubjectIds.length === 0 ||
    selectedSubjectIds.every((id) => (topicCounts[id] ?? 0) > 0);
  const { canGenerate, hint } = getGenerationReadiness({
    hasNotes,
    hasSubject,
    allSubjectsHaveTopics,
    questionCount,
  });
  const currentQuestion = quizQuestions[currentIndex];

  function handleAddFile(file: File) {
    setAttachedFiles((prev) =>
      prev.some((f) => f.name === file.name) ? prev : [...prev, file],
    );
  }

  function handleRemoveFile(name: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function handleToggleSubject(id: string) {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function handleTopicSelectionChange(subjectId: string, count: number) {
    setTopicCounts((prev) => ({ ...prev, [subjectId]: count }));
  }

  async function handleGenerate() {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2200));

      const subjectId = selectedSubjectIds[0] ?? aiCoachSubjects[0].id;
      const questions = generateMockQuestions({
        subjectId,
        count: questionCount,
        difficulty,
        type: toQuizQuestionType(questionType),
      });

      setQuizQuestions(questions);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setStep("quiz");
    } finally {
      setIsGenerating(false);
    }
  }

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
    quizQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected === q.correctAnswerId) {
        correctCount += 1;
        strongSet.add(q.topic);
      } else {
        weakSet.add(q.topic);
      }
    });
    const incorrectCount = quizQuestions.length - correctCount;
    const percentage = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizResult({
      totalQuestions: quizQuestions.length,
      correctCount,
      incorrectCount,
      finalScore: percentage,
      percentage,
      xpEarned: correctCount * 50,
      strongTopics: Array.from(strongSet),
      weakTopics: Array.from(weakSet).filter((t) => !strongSet.has(t)),
    });
    setStep("results");
  }
  function resetQuiz(next: Step) {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setQuizResult(null);
    setStep(next);
  }

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
          onExit={() => resetQuiz("setup")}
        />
      </div>
    );
  }
  if (step === "results" && quizResult) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-2 py-8">
        <ResultsScreen
          result={quizResult}
          onRetry={() => resetQuiz("quiz")}
          onPracticeWeak={() => resetQuiz("quiz")}
          onBackToCoach={() => resetQuiz("setup")}
        />
      </div>
    );
  }

  const selectedSubjects = aiCoachSubjects.filter((s) =>
    selectedSubjectIds.includes(s.id),
  );

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
        Загрузите конспекты или вставьте текст лекции — AI Exam Coach
        сгенерирует вопросы для самопроверки по выбранным предметам, с нужным
        количеством, уровнем сложности и типом вопросов.
      </p>
    </div>
  );

  if (keyLinked === false) {
    return (
      <div className="mx-auto max-w-360 space-y-5">
        {header}
        <GeminiKeyCard onLinked={() => setKeyLinked(true)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-360 space-y-5">
      {header}

      <NotesInput
        attachedFiles={attachedFiles}
        onAddFile={handleAddFile}
        onRemoveFile={handleRemoveFile}
        text={noteText}
        onTextChange={setNoteText}
        canGenerate={canGenerate}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        hint={hint}
      />

      <GenerationSettings
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        questionType={questionType}
        onQuestionTypeChange={setQuestionType}
      />

      <SubjectSelect
        selectedSubjectIds={selectedSubjectIds}
        onToggle={handleToggleSubject}
      />

      {selectedSubjects.length > 0 && (
        <div className="space-y-3">
          {selectedSubjects.map((subject) => (
            <SubjectTopicsPanel
              key={subject.id}
              subject={subject}
              onSelectionChange={handleTopicSelectionChange}
            />
          ))}
        </div>
      )}

      <GenerateButton
        canGenerate={canGenerate}
        hint={hint}
        onGenerate={handleGenerate}
      />
    </div>
  );
}
