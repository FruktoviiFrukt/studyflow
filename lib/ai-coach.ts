export const MAX_NOTE_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ — демо-лимит на загружаемый файл

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

export type AiCoachSubject = {
  id: string;
  name: string;
  dot: string;
  availableQuestions: number;
};

// Demo-данные: предметы, по которым уже накоплен банк вопросов для самопроверки.
export const aiCoachSubjects: AiCoachSubject[] = [
  {
    id: "programming",
    name: "Объектно-ориентированное программирование",
    dot: "bg-blue-500",
    availableQuestions: 48,
  },
  {
    id: "math",
    name: "Математический анализ",
    dot: "bg-violet-500",
    availableQuestions: 35,
  },
  {
    id: "databases",
    name: "Базы данных",
    dot: "bg-emerald-500",
    availableQuestions: 27,
  },
  {
    id: "networks",
    name: "Компьютерные сети",
    dot: "bg-amber-500",
    availableQuestions: 19,
  },
  {
    id: "english",
    name: "Английский язык",
    dot: "bg-rose-500",
    availableQuestions: 22,
  },
];

export const questionCountOptions = [5, 10, 15, 20] as const;

export const difficultyOptions = [
  { value: "easy", label: "Легко" },
  { value: "medium", label: "Средне" },
  { value: "hard", label: "Сложно" },
] as const;
export type Difficulty = (typeof difficultyOptions)[number]["value"];

export const questionTypeOptions = [
  { value: "single", label: "Тест (один ответ)" },
  { value: "true-false", label: "Верно / Неверно" },
  { value: "open", label: "Открытый вопрос" },
] as const;
export type QuestionType = (typeof questionTypeOptions)[number]["value"];

export type GenerationReadiness = {
  canGenerate: boolean;
  hint: string | null;
};

export function getGenerationReadiness(params: {
  hasSubject: boolean;
  hasNotes: boolean;
}): GenerationReadiness {
  const missingSteps: string[] = [];
  if (!params.hasSubject) missingSteps.push("выберите предмет");
  if (!params.hasNotes)
    missingSteps.push("добавьте конспект или текст заметок");

  return {
    canGenerate: missingSteps.length === 0,
    hint:
      missingSteps.length > 0
        ? `Чтобы продолжить: ${missingSteps.join(", ")}.`
        : null,
  };
}
