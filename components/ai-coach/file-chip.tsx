"use client";

import { FileText, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FileChipProps = {
  file: File;
  onRemove: (name: string) => void;
};

export default function FileChip({ file, onRemove }: FileChipProps) {
  const isImage = file.type.startsWith("image/");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700",
      )}
    >
      {isImage ? (
        <ImageIcon
          aria-hidden="true"
          className="size-3 shrink-0 text-gray-500"
        />
      ) : (
        <FileText
          aria-hidden="true"
          className="size-3 shrink-0 text-gray-500"
        />
      )}
      <span className="max-w-32 truncate">{file.name}</span>
      <button
        type="button"
        aria-label={`Удалить ${file.name}`}
        onClick={() => onRemove(file.name)}
        className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
