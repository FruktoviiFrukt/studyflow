"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import UploadNotes from "./upload-notes";
import PasteNotes from "./paste-notes";

const modes = [
  { value: "file", label: "Загрузить файл" },
  { value: "text", label: "Вставить текст" },
] as const;

type Mode = (typeof modes)[number]["value"];

type NotesInputProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  text: string;
  onTextChange: (text: string) => void;
};

export default function NotesInput({
  file,
  onFileChange,
  text,
  onTextChange,
}: NotesInputProps) {
  const [mode, setMode] = useState<Mode>("file");

  return (
    <Card className="rounded-2xl border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold sm:text-lg">
            Материалы для вопросов
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Загрузите конспект файлом или вставьте текст лекции вручную.
          </p>
        </div>
        <SegmentedControl
          options={modes}
          value={mode}
          onChange={setMode}
          ariaLabel="Способ добавления заметок"
          fullWidthOnMobile
        />
      </div>

      <div className="mt-4">
        {mode === "file" ? (
          <UploadNotes file={file} onFileChange={onFileChange} />
        ) : (
          <PasteNotes value={text} onChange={onTextChange} />
        )}
      </div>
    </Card>
  );
}
