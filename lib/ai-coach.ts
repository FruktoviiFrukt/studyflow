export const MAX_NOTE_FILE_SIZE = 10 * 1024 * 1024;

export const ACCEPTED_NOTE_TYPES = [
  { label: "PDF", mime: "application/pdf", extension: ".pdf" },
  {
    label: "DOCX",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: ".docx",
  },
  { label: "TXT", mime: "text/plain", extension: ".txt" },
  { label: "PNG", mime: "image/png", extension: ".png" },
  { label: "JPG", mime: "image/jpeg", extension: ".jpg" },
  { label: "WEBP", mime: "image/webp", extension: ".webp" },
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

export type ApiSubjectTopic = {
  id: string;
  name: string;
  questionCount: number;
};

export type ApiSubject = {
  id: string;
  name: string;
  code: string;
  faculty: string;
  availableQuestions: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  topics: ApiSubjectTopic[];
};

const DOT_PALETTE = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
];

export function subjectDotColor(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return DOT_PALETTE[hash % DOT_PALETTE.length];
}

export const questionCountOptions = [5, 10, 15, 20] as const;

export const difficultyOptions = [
  { value: "easy", label: "Легко" },
  { value: "medium", label: "Средне" },
  { value: "hard", label: "Сложно" },
  { value: "any", label: "Микс" },
] as const;
export type Difficulty = (typeof difficultyOptions)[number]["value"];

export type GenerationReadiness = {
  canGenerate: boolean;
  hint: string | null;
};

export function getGenerationReadiness(params: {
  hasNotes: boolean;
  questionCount?: number;
}): GenerationReadiness {
  const { hasNotes, questionCount = 5 } = params;

  if (questionCount < 5) {
    return {
      canGenerate: false,
      hint: "Минимальное количество вопросов — 5.",
    };
  }
  if (!hasNotes) {
    return {
      canGenerate: false,
      hint: "Добавьте текст или прикрепите файл.",
    };
  }
  return { canGenerate: true, hint: null };
}
