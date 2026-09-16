"use client";

import { ArrowUp, Loader2, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import AttachmentMenu from "./attachment-menu";
import FileChip from "./file-chip";

type NotesInputProps = {
  attachedFiles: File[];
  onAddFile: (file: File) => void;
  onRemoveFile: (name: string) => void;
  text: string;
  onTextChange: (text: string) => void;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  hint: string | null;
};

export default function NotesInput({
  attachedFiles,
  onAddFile,
  onRemoveFile,
  text,
  onTextChange,
  canGenerate,
  isGenerating,
  onGenerate,
  hint,
}: NotesInputProps) {
  return (
    <Card className="rounded-2xl border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 text-base font-semibold sm:text-lg">
        Материалы для вопросов
      </h3>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/40 transition-colors focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Вставьте сюда текст конспекта или лекции…"
          rows={6}
          aria-label="Текст заметок"
          className="resize-none rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-3 py-2">
            {attachedFiles.map((file) => (
              <FileChip key={file.name} file={file} onRemove={onRemoveFile} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 px-3 py-3">
          <AttachmentMenu onAddFile={onAddFile} />
          <button
            type="button"
            disabled={!canGenerate || isGenerating}
            onClick={onGenerate}
            aria-label="Сгенерировать вопросы"
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-colors",
              canGenerate && !isGenerating
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-gray-100 text-gray-400",
            )}
          >
            {isGenerating ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <ArrowUp aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      </div>

      {!canGenerate && hint && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
          <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          {hint}
        </p>
      )}
    </Card>
  );
}
