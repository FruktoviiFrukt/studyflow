export type QuestionType = "multiple-choice" | "true-false";
export type Difficulty = "easy" | "medium" | "hard";

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: AnswerOption[];
  correctAnswerId: string;
  topic: string;
  subjectId: string;
  difficulty: Difficulty;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
}

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  finalScore: number;
  percentage: number;
  xpEarned: number;
  strongTopics: string[];
  weakTopics: string[];
}

export type QuizScreenState = "quiz" | "results";
