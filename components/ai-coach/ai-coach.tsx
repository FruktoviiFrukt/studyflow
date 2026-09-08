"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import NotesInput from "./notes-input";
import SubjectSelect from "./subject-select";
import GenerationSettings from "./generation-settings";
import GenerateButton from "./generate-button";
import { QuizScreen } from "./QuizScreen";
import { ResultsScreen } from "./ResultsScreen";
import { mockQuestions } from "@/lib/mockQuiz";
import { QuizResult } from "@/types/quiz";
import {
  getGenerationReadiness,
  type Difficulty,
  type QuestionType,
} from "@/lib/ai-coach";

type Step = "setup" | "quiz" | "results";

export default function AiCoach() {
  const [step, setStep] = useState<Step>("setup");

  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [noteText, setNoteText] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionType, setQuestionType] = useState<QuestionType>("single");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const hasNotes = noteFile !== null || noteText.trim().length > 0;
  const hasSubject = selectedSubjectId !== null;
  const { canGenerate, hint } = getGenerationReadiness({
    hasSubject,
    hasNotes,
  });
  const currentQuestion = mockQuestions[currentIndex];

  function handleSelectOption(optionId: string) {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  }
  function handleNext() {
    if (currentIndex < mockQuestions.length - 1) setCurrentIndex((i) => i + 1);
  }
  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }
  function handleFinish() {
    let correctCount = 0;
    const strongSet = new Set<string>();
    const weakSet = new Set<string>();
    mockQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected === q.correctAnswerId) {
        correctCount += 1;
        strongSet.add(q.topic);
      } else {
        weakSet.add(q.topic);
      }
    });
    const incorrectCount = mockQuestions.length - correctCount;
    const percentage = Math.round((correctCount / mockQuestions.length) * 100);
    setQuizResult({
      totalQuestions: mockQuestions.length,
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

  if (step === "quiz") {
    return (
      <QuizScreen
        question={currentQuestion}
        currentIndex={currentIndex}
        totalQuestions={mockQuestions.length}
        selectedOptionId={selectedAnswers[currentQuestion.id]}
        onSelectOption={handleSelectOption}
        onNext={handleNext}
        onPrev={handlePrev}
        onFinish={handleFinish}
      />
    );
  }
  if (step === "results" && quizResult) {
    return (
      <ResultsScreen
        result={quizResult}
        onRetry={() => resetQuiz("quiz")}
        onPracticeWeak={() => resetQuiz("quiz")}
        onBackToCoach={() => resetQuiz("setup")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
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
          сгенерирует вопросы для самопроверки по выбранному предмету, с нужным
          количеством, уровнем сложности и типом вопросов. Так вы быстро
          увидите, что уже усвоено, а что стоит повторить перед экзаменом.
        </p>
      </div>

      <NotesInput
        file={noteFile}
        onFileChange={setNoteFile}
        text={noteText}
        onTextChange={setNoteText}
      />

      <SubjectSelect
        selectedSubjectId={selectedSubjectId}
        onSelect={setSelectedSubjectId}
      />

      <GenerationSettings
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        questionType={questionType}
        onQuestionTypeChange={setQuestionType}
      />

      <GenerateButton
        canGenerate={canGenerate}
        hint={hint}
        onGenerated={() => setStep("quiz")}
      />
    </div>
  );
}
