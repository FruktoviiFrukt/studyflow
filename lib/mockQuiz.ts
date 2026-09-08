import { Question, Difficulty, QuizResult } from "@/types/quiz";

export const mockQuestions: Question[] = [
  // Объектно-ориентированное программирование
  {
    id: "prog-1",
    subjectId: "programming",
    difficulty: "easy",
    type: "multiple-choice",
    text: "Что из перечисленного является одним из принципов ООП?",
    options: [
      { id: "a", text: "Инкапсуляция" },
      { id: "b", text: "Компиляция" },
      { id: "c", text: "Индексация" },
      { id: "d", text: "Рефакторинг" },
    ],
    correctAnswerId: "a",
    topic: "Основы ООП",
  },
  {
    id: "prog-2",
    subjectId: "programming",
    difficulty: "medium",
    type: "true-false",
    text: "Наследование позволяет классу использовать поля и методы родительского класса.",
    options: [
      { id: "opt-true", text: "Верно" },
      { id: "opt-false", text: "Неверно" },
    ],
    correctAnswerId: "opt-true",
    topic: "Наследование",
  },
  {
    id: "prog-3",
    subjectId: "programming",
    difficulty: "hard",
    type: "multiple-choice",
    text: "Какой принцип ООП нарушается, если класс-наследник переопределяет метод так, что перестаёт соответствовать контракту базового класса?",
    options: [
      { id: "a", text: "Инкапсуляция" },
      { id: "b", text: "Принцип подстановки Барбары Лисков" },
      { id: "c", text: "Абстракция" },
      { id: "d", text: "Композиция" },
    ],
    correctAnswerId: "b",
    topic: "Полиморфизм",
  },

  // Математический анализ
  {
    id: "math-1",
    subjectId: "math",
    difficulty: "easy",
    type: "true-false",
    text: "Производная константы всегда равна нулю.",
    options: [
      { id: "opt-true", text: "Верно" },
      { id: "opt-false", text: "Неверно" },
    ],
    correctAnswerId: "opt-true",
    topic: "Производные",
  },
  {
    id: "math-2",
    subjectId: "math",
    difficulty: "medium",
    type: "multiple-choice",
    text: "Чему равен предел функции sin(x)/x при x → 0?",
    options: [
      { id: "a", text: "0" },
      { id: "b", text: "1" },
      { id: "c", text: "∞" },
      { id: "d", text: "Не существует" },
    ],
    correctAnswerId: "b",
    topic: "Пределы",
  },
  {
    id: "math-3",
    subjectId: "math",
    difficulty: "hard",
    type: "multiple-choice",
    text: "Какой метод обычно используют для интегрирования произведения двух функций?",
    options: [
      { id: "a", text: "Метод подстановки" },
      { id: "b", text: "Интегрирование по частям" },
      { id: "c", text: "Правило Лопиталя" },
      { id: "d", text: "Метод Ньютона" },
    ],
    correctAnswerId: "b",
    topic: "Интегралы",
  },

  // Базы данных
  {
    id: "db-1",
    subjectId: "databases",
    difficulty: "easy",
    type: "multiple-choice",
    text: "Как называется процесс устранения избыточности данных в реляционной БД?",
    options: [
      { id: "a", text: "Индексация" },
      { id: "b", text: "Нормализация" },
      { id: "c", text: "Репликация" },
      { id: "d", text: "Шардирование" },
    ],
    correctAnswerId: "b",
    topic: "Нормализация",
  },
  {
    id: "db-2",
    subjectId: "databases",
    difficulty: "medium",
    type: "true-false",
    text: "INNER JOIN возвращает только те строки, для которых есть совпадение в обеих таблицах.",
    options: [
      { id: "opt-true", text: "Верно" },
      { id: "opt-false", text: "Неверно" },
    ],
    correctAnswerId: "opt-true",
    topic: "SQL JOIN",
  },
  {
    id: "db-3",
    subjectId: "databases",
    difficulty: "hard",
    type: "multiple-choice",
    text: "Какой тип индекса лучше всего подходит для точного поиска по равенству в большой таблице?",
    options: [
      { id: "a", text: "B-tree" },
      { id: "b", text: "Hash-индекс" },
      { id: "c", text: "Bitmap" },
      { id: "d", text: "Full-text" },
    ],
    correctAnswerId: "b",
    topic: "Индексы",
  },

  // Компьютерные сети
  {
    id: "net-1",
    subjectId: "networks",
    difficulty: "easy",
    type: "true-false",
    text: "Протокол TCP гарантирует доставку пакетов данных получателю.",
    options: [
      { id: "opt-true", text: "Верно" },
      { id: "opt-false", text: "Неверно" },
    ],
    correctAnswerId: "opt-true",
    topic: "TCP/IP",
  },
  {
    id: "net-2",
    subjectId: "networks",
    difficulty: "medium",
    type: "multiple-choice",
    text: "Какой протокол отвечает за преобразование доменных имён в IP-адреса?",
    options: [
      { id: "a", text: "HTTP" },
      { id: "b", text: "FTP" },
      { id: "c", text: "DNS" },
      { id: "d", text: "SMTP" },
    ],
    correctAnswerId: "c",
    topic: "DNS",
  },
  {
    id: "net-3",
    subjectId: "networks",
    difficulty: "hard",
    type: "multiple-choice",
    text: "Какой код статуса HTTP означает временное перенаправление на другой адрес?",
    options: [
      { id: "a", text: "301" },
      { id: "b", text: "307" },
      { id: "c", text: "404" },
      { id: "d", text: "502" },
    ],
    correctAnswerId: "b",
    topic: "HTTP",
  },

  // Английский язык
  {
    id: "eng-1",
    subjectId: "english",
    difficulty: "easy",
    type: "multiple-choice",
    text: "Выберите правильную форму глагола: 'She ___ to school every day.'",
    options: [
      { id: "a", text: "go" },
      { id: "b", text: "goes" },
      { id: "c", text: "going" },
      { id: "d", text: "gone" },
    ],
    correctAnswerId: "b",
    topic: "Present Simple",
  },
  {
    id: "eng-2",
    subjectId: "english",
    difficulty: "medium",
    type: "true-false",
    text: "Артикль 'the' используется, когда речь идёт о чём-то конкретном, уже известном собеседнику.",
    options: [
      { id: "opt-true", text: "Верно" },
      { id: "opt-false", text: "Неверно" },
    ],
    correctAnswerId: "opt-true",
    topic: "Articles",
  },
  {
    id: "eng-3",
    subjectId: "english",
    difficulty: "hard",
    type: "multiple-choice",
    text: "Какое время используется в предложении: 'By the time she arrived, we had already left'?",
    options: [
      { id: "a", text: "Past Simple" },
      { id: "b", text: "Past Continuous" },
      { id: "c", text: "Past Perfect" },
      { id: "d", text: "Present Perfect" },
    ],
    correctAnswerId: "c",
    topic: "Past Perfect",
  },
];

export const mockQuizResult: QuizResult = {
  totalQuestions: 5,
  correctCount: 4,
  incorrectCount: 1,
  finalScore: 80,
  percentage: 80,
  xpEarned: 200,
  strongTopics: ["Основы ООП", "SQL JOIN"],
  weakTopics: ["Пределы"],
};

type GenerateParams = {
  subjectId: string;
  count: number;
  difficulty: Difficulty;
  type: "multiple-choice" | "true-false";
};

/** Демо-генерация: пока нет реального AI-бэкенда, подбираем вопросы из
 готового банка.*/

export function generateMockQuestions({
  subjectId,
  count,
  difficulty,
  type,
}: GenerateParams): Question[] {
  const bySubjectAndType = mockQuestions.filter(
    (q) => q.subjectId === subjectId && q.type === type,
  );
  const byTypeOnly = mockQuestions.filter((q) => q.type === type);

  const pool = bySubjectAndType.length > 0 ? bySubjectAndType : byTypeOnly;

  const ordered = [...pool].sort((a, b) => {
    const scoreOf = (q: Question) => (q.difficulty === difficulty ? 1 : 0);
    return scoreOf(b) - scoreOf(a);
  });

  const result: Question[] = [];
  for (let i = 0; i < count; i += 1) {
    const base = ordered[i % ordered.length];
    const repeat = Math.floor(i / ordered.length);
    result.push(repeat === 0 ? base : { ...base, id: `${base.id}-r${repeat}` });
  }
  return result;
}
