"use client";

import type { ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";

const MIN_PASTE_LENGTH = 200;

type PasteNotesProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function PasteNotes({ value, onChange }: PasteNotesProps) {
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  const length = value.trim().length;
  const isTooShort = length > 0 && length < MIN_PASTE_LENGTH;

  return (
    <div>
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder="Вставьте сюда текст конспекта или лекции…"
        rows={8}
        aria-label="Текст заметок"
        className="resize-y"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>{length} символов</span>
        {isTooShort && (
          <span className="text-amber-600">
            Добавьте ещё немного текста для точной генерации
          </span>
        )}
      </div>
    </div>
  );
}
