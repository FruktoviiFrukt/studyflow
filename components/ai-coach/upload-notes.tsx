"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AlertCircle, FileText, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_NOTE_INPUT_ATTR,
  MAX_NOTE_FILE_SIZE,
  formatFileSize,
  isAcceptedNoteFile,
} from "@/lib/ai-coach";
import { cn } from "@/lib/utils";

type UploadNotesProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
};

export default function UploadNotes({ file, onFileChange }: UploadNotesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndSet(candidate: File | undefined) {
    if (!candidate) return;
    if (!isAcceptedNoteFile(candidate)) {
      setError("Поддерживаются только файлы PDF и DOCX.");
      return;
    }
    if (candidate.size > MAX_NOTE_FILE_SIZE) {
      setError(
        `Файл слишком большой. Максимальный размер — ${formatFileSize(MAX_NOTE_FILE_SIZE)}.`,
      );
      return;
    }
    setError(null);
    onFileChange(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSet(event.dataTransfer.files[0]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    validateAndSet(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleRemove() {
    setError(null);
    onFileChange(null);
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_NOTE_INPUT_ATTR}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleInputChange}
      />

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <FileText
              aria-hidden="true"
              className="size-8 shrink-0 text-blue-600"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Удалить файл"
            onClick={handleRemove}
          >
            <Trash2 className="size-4 text-gray-500" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Загрузить конспект"
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-8",
            isDragging
              ? "border-blue-400 bg-blue-50/60"
              : "border-gray-200 bg-gray-50/40 hover:border-blue-300 hover:bg-blue-50/40",
          )}
        >
          <UploadCloud
            aria-hidden="true"
            className={cn(
              "size-8",
              isDragging ? "text-blue-600" : "text-gray-400",
            )}
          />
          <p className="text-sm font-medium text-gray-700">
            Перетащите файл сюда или нажмите, чтобы выбрать
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOCX — до {formatFileSize(MAX_NOTE_FILE_SIZE)}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/60 p-3 text-xs leading-5 text-red-600">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </>
  );
}
