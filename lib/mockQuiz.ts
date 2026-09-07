import { Question, QuizResult } from "@/types/quiz";

export const mockQuestions: Question[] = [
  {
    id: "q1",
    text: "Какова основная цель использования Virtual DOM в React?",
    type: "multiple-choice",
    options: [
      {
        id: "opt1",
        text: "Прямое обновление реального DOM при каждом изменении состояния",
      },
      {
        id: "opt2",
        text: "Минимизация операций с реальным DOM за счет сравнения изменений в памяти",
      },
      {
        id: "opt3",
        text: "Автоматическое управление подключениями к базе данных",
      },
      { id: "opt4", text: "Замена CSS-стилей для элементов" },
    ],
    correctAnswerId: "opt2",
    topic: "Основы React",
  },
  {
    id: "q2",
    text: "Код на TypeScript может выполняться браузером напрямую без компиляции в JavaScript.",
    type: "true-false",
    options: [
      { id: "opt-true", text: "Верно" },
      { id: "opt-false", text: "Неверно" },
    ],
    correctAnswerId: "opt-false",
    topic: "Основы TypeScript",
  },
  {
    id: "q3",
    text: "Какой утилитарный класс Tailwind CSS центрирует flex-элементы по поперечной оси (cross axis)?",
    type: "multiple-choice",
    options: [
      { id: "opt1", text: "justify-center" },
      { id: "opt2", text: "items-center" },
      { id: "opt3", text: "content-center" },
      { id: "opt4", text: "text-center" },
    ],
    correctAnswerId: "opt2",
    topic: "Tailwind CSS",
  },
  {
    id: "q4",
    text: "В Next.js App Router компоненты внутри папки app по умолчанию являются Server Components.",
    type: "true-false",
    options: [
      { id: "opt-true", text: "Верно" },
      { id: "opt-false", text: "Неверно" },
    ],
    correctAnswerId: "opt-true",
    topic: "Next.js App Router",
  },
  {
    id: "q5",
    text: "Какой метод HTTP является идемпотентным и используется для полной замены ресурса?",
    type: "multiple-choice",
    options: [
      { id: "opt1", text: "POST" },
      { id: "opt2", text: "GET" },
      { id: "opt3", text: "PUT" },
      { id: "opt4", text: "PATCH" },
    ],
    correctAnswerId: "opt3",
    topic: "Веб-архитектура",
  },
];

export const mockQuizResult: QuizResult = {
  totalQuestions: 5,
  correctCount: 4,
  incorrectCount: 1,
  finalScore: 80,
  percentage: 80,
  xpEarned: 200,
  strongTopics: ["Основы React", "Next.js App Router", "Веб-архитектура"],
  weakTopics: ["Основы TypeScript"],
};
