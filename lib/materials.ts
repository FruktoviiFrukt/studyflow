import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  SUBJECTS,
  type Material,
  type MaterialType,
} from "@/components/materials/types";

export const MAX_MATERIAL_BYTES = 50 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 200;

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "materials");

const MATERIAL_TYPES: MaterialType[] = [
  "pdf",
  "docx",
  "pptx",
  "xlsx",
  "png",
  "jpg",
  "txt",
];

const MIME_BY_TYPE: Record<MaterialType, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  txt: "text/plain",
};

export type MaterialRecord = {
  id: string;
  title: string;
  subject: string;
  type: string;
  size: number;
  originalName: string;
  storageKey: string;
  mimeType: string;
  uploadedAt: Date;
};

export function toMaterialDto(record: MaterialRecord): Material {
  return {
    id: record.id,
    title: record.title,
    subject: record.subject,
    type: record.type as MaterialType,
    size: record.size,
    uploadedAt: record.uploadedAt.toISOString(),
  };
}

export function materialTypeFromFileName(name: string): MaterialType | null {
  const ext = path.extname(name).slice(1).toLowerCase();
  if (ext === "doc") return "docx";
  if (ext === "ppt") return "pptx";
  if (ext === "xls") return "xlsx";
  if (ext === "jpeg") return "jpg";
  if (MATERIAL_TYPES.includes(ext as MaterialType)) return ext as MaterialType;
  return null;
}

export function extensionFromFileName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".jpeg") return ".jpg";
  if (ext === ".doc") return ".doc";
  return ext;
}

export function mimeTypeFor(type: MaterialType, fileType: string): string {
  if (fileType && fileType !== "application/octet-stream") return fileType;
  return MIME_BY_TYPE[type];
}

export function isAllowedSubject(subject: string): boolean {
  return (SUBJECTS as readonly string[]).includes(subject);
}

export function validateTitle(title: string): string | null {
  const value = title.trim();
  if (!value) return "Укажите название материала.";
  if (value.length > MAX_TITLE_LENGTH) {
    return `Название слишком длинное (максимум ${MAX_TITLE_LENGTH} символов).`;
  }
  return null;
}

export function storagePath(storageKey: string): string {
  const root = path.resolve(UPLOAD_ROOT);
  const full = path.resolve(root, storageKey);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return full;
}

export async function saveMaterialFile(
  storageKey: string,
  bytes: Buffer,
): Promise<void> {
  const fullPath = storagePath(storageKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
}

export async function readMaterialFile(storageKey: string): Promise<Buffer> {
  return readFile(storagePath(storageKey));
}

export async function deleteMaterialFile(storageKey: string): Promise<void> {
  try {
    await unlink(storagePath(storageKey));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function contentDisposition(
  kind: "inline" | "attachment",
  filename: string,
): string {
  const ascii = filename.replace(/[^\x20-\x7E]+/g, "_") || "file";
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
