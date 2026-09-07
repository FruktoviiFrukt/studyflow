"use client";

import { useState } from "react";
import { mockQuestions } from "@/lib/mockQuiz"; // если лежит в data, измени на '@/data/mockQuiz'
import { QuizResult } from "@/types/quiz";
import { QuizScreen } from "@/components/ai-coach/QuizScreen";
import { ResultsScreen } from "@/components/ai-coach/ResultsScreen";

export default function AiCoachPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [isFinished, setIsFinished] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const currentQuestion = mockQuestions[currentIndex];

  const handleSelectOption = (optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < mockQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
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

    const result: QuizResult = {
      totalQuestions: mockQuestions.length,
      correctCount,
      incorrectCount,
      finalScore: percentage,
      percentage,
      xpEarned: correctCount * 50,
      strongTopics: Array.from(strongSet),
      weakTopics: Array.from(weakSet).filter((topic) => !strongSet.has(topic)),
    };

    setQuizResult(result);
    setIsFinished(true);
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
    setQuizResult(null);
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 md:p-12 bg-background flex flex-col items-center">
      <div className="w-full max-w-3xl mb-6">
        <h1 className="text-2xl font-bold text-foreground">AI Exam Coach</h1>
      </div>

      {!isFinished ? (
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
      ) : (
        quizResult && (
          <ResultsScreen
            result={quizResult}
            onRetry={handleRetry}
            onPracticeWeak={handleRetry}
            onBackToCoach={() => setIsFinished(false)}
          />
        )
      )}
    </main>
  );
}
