export const SUBJECTS = [
  "Программирование",
  "Высшая математика",
  "Базы данных",
  "Компьютерные сети",
] as const;

export type MaterialType =
  "pdf" | "docx" | "pptx" | "xlsx" | "png" | "jpg" | "txt";

export type Material = {
  id: string;
  title: string;
  subject: string;
  type: MaterialType;
  size: number;
  uploadedAt: string;
  file?: File | null;
};

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function typeFromFileName(name: string): MaterialType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "doc") return "docx";
  if (ext === "ppt") return "pptx";
  if (ext === "xls") return "xlsx";
  if (ext === "jpeg") return "jpg";
  if (["pdf", "docx", "pptx", "xlsx", "png", "jpg", "txt"].includes(ext)) {
    return ext as MaterialType;
  }
  return "txt";
}

export const TYPE_META: Record<
  MaterialType,
  { label: string; className: string; iconClassName: string }
> = {
  pdf: {
    label: "PDF",
    className: "bg-rose-50 text-rose-700",
    iconClassName: "bg-rose-50 text-rose-600",
  },
  docx: {
    label: "DOCX",
    className: "bg-blue-50 text-blue-700",
    iconClassName: "bg-blue-50 text-blue-600",
  },
  pptx: {
    label: "PPTX",
    className: "bg-orange-50 text-orange-700",
    iconClassName: "bg-orange-50 text-orange-600",
  },
  xlsx: {
    label: "XLSX",
    className: "bg-emerald-50 text-emerald-700",
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  png: {
    label: "PNG",
    className: "bg-violet-50 text-violet-700",
    iconClassName: "bg-violet-50 text-violet-600",
  },
  jpg: {
    label: "JPG",
    className: "bg-violet-50 text-violet-700",
    iconClassName: "bg-violet-50 text-violet-600",
  },
  txt: {
    label: "TXT",
    className: "bg-gray-100 text-gray-700",
    iconClassName: "bg-gray-100 text-gray-600",
  },
};
