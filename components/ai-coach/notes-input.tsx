"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isAcceptedNoteFile } from "@/lib/ai-coach";
import AttachmentMenu from "./attachment-menu";
import FileChip from "./file-chip";

type NotesInputProps = {
  attachedFiles: File[];
  onAddFile: (file: File) => void;
  onRemoveFile: (name: string) => void;
  text: string;
  onTextChange: (text: string) => void;
};

export default function NotesInput({
  attachedFiles,
  onAddFile,
  onRemoveFile,
  text,
  onTextChange,
}: NotesInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.stopPropagation();
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach((file) => {
      if (isAcceptedNoteFile(file)) onAddFile(file);
    });
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gray-50/40 transition-colors",
        isDragging
          ? "border-blue-400 ring-1 ring-blue-400"
          : "border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-blue-50/90">
          <Upload aria-hidden="true" className="size-8 text-blue-500" />
          <p className="text-sm font-medium text-blue-700">
            Отпустите для загрузки
          </p>
          <p className="text-xs text-blue-400">
            PDF, DOCX, TXT, PNG, JPG, WEBP
          </p>
        </div>
      )}

      <Textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Вставьте текст конспекта, лекции или введите вопросы… Можно перетащить файл или изображение."
        rows={7}
        aria-label="Текст материала"
        className="resize-none rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-3 py-2">
          {attachedFiles.map((file) => (
            <FileChip key={file.name} file={file} onRemove={onRemoveFile} />
          ))}
        </div>
      )}

      <div className="flex items-center border-t border-gray-100 px-3 py-2">
        <AttachmentMenu onAddFile={onAddFile} />
        <span className="ml-3 text-xs text-gray-400">
          PDF, DOCX, TXT, PNG, JPG, WEBP
        </span>
      </div>
    </div>
  );
}
