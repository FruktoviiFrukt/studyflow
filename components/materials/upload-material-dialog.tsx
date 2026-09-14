"use client";

import {
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SUBJECTS,
  formatFileSize,
  type MaterialType,
  typeFromFileName,
} from "./types";
import { cn } from "@/lib/utils";

const ACCEPTED = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.txt";
const MAX_SIZE = 50 * 1024 * 1024;
const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export type NewMaterialPayload = {
  title: string;
  subject: string;
  type: MaterialType;
  size: number;
  file: File | null;
};

type UploadMaterialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewMaterialPayload) => void;
};

export default function UploadMaterialDialog({
  open,
  onOpenChange,
  onSubmit,
}: UploadMaterialDialogProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setSubject("");
    setFile(null);
    setError(null);
    setDragging(false);
  }

  function applyFile(candidate: File | undefined) {
    if (!candidate) return;
    if (candidate.size > MAX_SIZE) {
      setError("Файл слишком большой. Максимум — 50 МБ.");
      return;
    }
    setError(null);
    setFile(candidate);
    setTitle((current) => current || candidate.name.replace(/\.[^.]+$/, ""));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Укажите название материала.");
      return;
    }
    if (!subject) {
      setError("Выберите предмет.");
      return;
    }
    onSubmit({
      title: title.trim(),
      subject,
      type: file ? typeFromFileName(file.name) : "pdf",
      size: file?.size ?? 0,
      file,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Загрузить материал</DialogTitle>
          <DialogDescription>
            PDF, DOCX, PPTX, XLSX и изображения — до 50 МБ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            className={cn(
              "block cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-gray-50/60 hover:border-blue-300 hover:bg-blue-50/40",
            )}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={(event: DragEvent<HTMLLabelElement>) => {
              event.preventDefault();
              setDragging(false);
              applyFile(event.dataTransfer.files[0]);
            }}
          >
            <input
              type="file"
              accept={ACCEPTED}
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                applyFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UploadCloud size={22} />
            </div>
            <p className="text-sm font-semibold text-gray-900">
              Перетащите файл сюда
            </p>
            <p className="mt-1 text-xs text-gray-500">
              или нажмите, чтобы выбрать с компьютера
            </p>
            {file && (
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-blue-700">
                <FileText size={14} />
                {file.name} · {formatFileSize(file.size)}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Название
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              placeholder="Например, Конспект по лабораторной №4"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Предмет
            </span>
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className={inputClass}
            >
              <option value="">Выберите предмет</option>
              {SUBJECTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Отмена
            </Button>
            <Button type="submit" className="rounded-xl">
              Загрузить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
