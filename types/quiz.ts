export type QuestionType = "multiple-choice" | "true-false";

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: AnswerOption[];
  correctAnswerId: string; // Поле для проверки правильного ответа
  topic: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
}

export interface QuizResult {
  totalQuestions: number; // Общее количество вопросов
  correctCount: number;
  incorrectCount: number;
  finalScore: number;
  percentage: number;
  xpEarned: number;
  strongTopics: string[];
  weakTopics: string[];
}

export type QuizScreenState = "quiz" | "results";
