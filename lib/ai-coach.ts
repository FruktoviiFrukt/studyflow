export const MAX_NOTE_FILE_SIZE = 10 * 1024 * 1024;

export const ACCEPTED_NOTE_TYPES = [
  { label: "PDF", mime: "application/pdf", extension: ".pdf" },
  {
    label: "DOCX",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: ".docx",
  },
] as const;

export const ACCEPTED_NOTE_INPUT_ATTR = ACCEPTED_NOTE_TYPES.map(
  (type) => `${type.extension},${type.mime}`,
).join(",");

export function isAcceptedNoteFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_NOTE_TYPES.some(
    (type) => file.type === type.mime || name.endsWith(type.extension),
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  const units = ["КБ", "МБ", "ГБ"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export type SubjectTopic = {
  id: string;
  name: string;
};

export type SavedQuiz = {
  id: string;
  name: string;
  questionCount: number;
};

export type AiCoachSubject = {
  id: string;
  name: string;
  dot: string;
  availableQuestions: number;
  topics: SubjectTopic[];
  savedQuizzes: SavedQuiz[];
};

export const aiCoachSubjects: AiCoachSubject[] = [
  {
    id: "programming",
    name: "Объектно-ориентированное программирование",
    dot: "bg-blue-500",
    availableQuestions: 48,
    topics: [
      { id: "prog-t1", name: "Основы ООП" },
      { id: "prog-t2", name: "Наследование" },
      { id: "prog-t3", name: "Полиморфизм" },
      { id: "prog-t4", name: "Инкапсуляция" },
      { id: "prog-t5", name: "Абстракция" },
      { id: "prog-t6", name: "Паттерны проектирования" },
      { id: "prog-t7", name: "SOLID принципы" },
      { id: "prog-t8", name: "Интерфейсы и абстрактные классы" },
      { id: "prog-t9", name: "Generics и шаблоны" },
      { id: "prog-t10", name: "Исключения и обработка ошибок" },
      { id: "prog-t11", name: "Коллекции и итераторы" },
      { id: "prog-t12", name: "Многопоточность" },
      { id: "prog-t13", name: "Паттерн Observer" },
      { id: "prog-t14", name: "Паттерн Singleton" },
      { id: "prog-t15", name: "Лямбды и функциональные интерфейсы" },
      { id: "prog-t16", name: "Рефлексия" },
    ],
    savedQuizzes: [
      { id: "prog-q1", name: "ООП базовый", questionCount: 10 },
      { id: "prog-q2", name: "Паттерны проектирования", questionCount: 15 },
    ],
  },
  {
    id: "math",
    name: "Математический анализ",
    dot: "bg-violet-500",
    availableQuestions: 35,
    topics: [
      { id: "math-t1", name: "Пределы" },
      { id: "math-t2", name: "Производные" },
      { id: "math-t3", name: "Интегралы" },
      { id: "math-t4", name: "Ряды" },
      { id: "math-t5", name: "Дифференциальные уравнения" },
      { id: "math-t6", name: "Функции нескольких переменных" },
    ],
    savedQuizzes: [
      { id: "math-q1", name: "Дифференциальное исчисление", questionCount: 10 },
    ],
  },
  {
    id: "databases",
    name: "Базы данных",
    dot: "bg-emerald-500",
    availableQuestions: 27,
    topics: [
      { id: "db-t1", name: "Нормализация" },
      { id: "db-t2", name: "SQL JOIN" },
      { id: "db-t3", name: "Индексы" },
      { id: "db-t4", name: "Транзакции" },
      { id: "db-t5", name: "NoSQL" },
      { id: "db-t6", name: "Проектирование схем" },
    ],
    savedQuizzes: [
      { id: "db-q1", name: "SQL основы", questionCount: 12 },
      { id: "db-q2", name: "Транзакции и ACID", questionCount: 8 },
    ],
  },
  {
    id: "networks",
    name: "Компьютерные сети",
    dot: "bg-amber-500",
    availableQuestions: 19,
    topics: [
      { id: "net-t1", name: "TCP/IP" },
      { id: "net-t2", name: "DNS" },
      { id: "net-t3", name: "HTTP/HTTPS" },
      { id: "net-t4", name: "OSI модель" },
      { id: "net-t5", name: "Маршрутизация" },
      { id: "net-t6", name: "Безопасность сетей" },
    ],
    savedQuizzes: [],
  },
  {
    id: "english",
    name: "Английский язык",
    dot: "bg-rose-500",
    availableQuestions: 22,
    topics: [
      { id: "eng-t1", name: "Present Simple" },
      { id: "eng-t2", name: "Articles" },
      { id: "eng-t3", name: "Past Perfect" },
      { id: "eng-t4", name: "Условные предложения" },
      { id: "eng-t5", name: "Модальные глаголы" },
      { id: "eng-t6", name: "Причастия" },
    ],
    savedQuizzes: [{ id: "eng-q1", name: "Grammar basics", questionCount: 20 }],
  },
];

export const questionCountOptions = [10, 15, 20, 30] as const;

export const difficultyOptions = [
  { value: "easy", label: "Легко" },
  { value: "medium", label: "Средне" },
  { value: "hard", label: "Сложно" },
] as const;
export type Difficulty = (typeof difficultyOptions)[number]["value"];

export const questionTypeOptions = [
  { value: "single", label: "Тест (один ответ)" },
  { value: "true-false", label: "Верно / Неверно" },
  { value: "combined", label: "Комбинированный" },
] as const;
export type QuestionType = (typeof questionTypeOptions)[number]["value"];

export type GenerationReadiness = {
  canGenerate: boolean;
  hint: string | null;
};

export function getGenerationReadiness(params: {
  hasNotes: boolean;
  hasSubject: boolean;
  allSubjectsHaveTopics: boolean;
  questionCount: number;
}): GenerationReadiness {
  const { hasNotes, hasSubject, allSubjectsHaveTopics, questionCount } = params;

  if (questionCount < 10) {
    return {
      canGenerate: false,
      hint: "Минимальное количество вопросов — 10.",
    };
  }
  if (hasSubject && !allSubjectsHaveTopics) {
    return {
      canGenerate: false,
      hint: "Выберите хотя бы одну тему для каждого предмета.",
    };
  }
  if (!hasNotes && !hasSubject) {
    return {
      canGenerate: false,
      hint: "Добавьте материалы или выберите предмет с темами.",
    };
  }
  return { canGenerate: true, hint: null };
}
