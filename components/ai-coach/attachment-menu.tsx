"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Image, Plus } from "lucide-react";

type AttachmentMenuProps = {
  onAddFile: (file: File) => void;
};

export default function AttachmentMenu({ onAddFile }: AttachmentMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onAddFile(file);
    e.target.value = "";
    setOpen(false);
  }

  const items = [
    {
      label: "Добавить файл",
      icon: FileText,
      inputRef: fileInputRef,
    },
    {
      label: "Выбрать фото",
      icon: Image,
      inputRef: photoInputRef,
    },
    {
      label: "Сделать фото",
      icon: Camera,
      inputRef: cameraInputRef,
    },
  ] as const;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleFileChange}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleFileChange}
      />

      <button
        type="button"
        aria-label="Прикрепить файл"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>

      {open && (
        <div className="absolute bottom-10 left-0 z-20 min-w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {items.map(({ label, icon: Icon, inputRef }) => (
            <button
              key={label}
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Icon aria-hidden="true" className="size-4 text-gray-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
