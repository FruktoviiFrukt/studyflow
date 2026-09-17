"use client";

import { useRef, useState, type FormEvent } from "react";
import { FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, SelectField, fieldClass } from "./schedule-fields";

export type UploadDetails = {
  year: string;
  course: string;
  semester: string;
  file: File;
};
export default function ScheduleUpload({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (details: UploadDetails) => void;
}) {
  const [year, setYear] = useState("2026/2027");
  const [course, setCourse] = useState("1");
  const [semester, setSemester] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  function choose(next?: File) {
    setError("");
    setFile(null);
    if (!next) return;
    if (!/\.pdf$/i.test(next.name)) {
      setError("Выберите файл PDF.");
      return;
    }
    if (!next.size || next.size > 20 * 1024 * 1024) {
      setError("Нужен непустой PDF размером до 20 МБ.");
      return;
    }
    setFile(next);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Выберите PDF расписания.");
      return;
    }
    const match = /^(20\d{2})\/(20\d{2})$/.exec(year);
    if (!match || Number(match[2]) !== Number(match[1]) + 1) {
      setError("Укажите последовательные годы, например 2026/2027.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const signature = new TextDecoder().decode(
        await file.slice(0, 5).arrayBuffer(),
      );
      if (signature !== "%PDF-") {
        setError(
          "Содержимое файла не похоже на PDF. Выберите исходный документ.",
        );
        return;
      }
      onCreate({ year, course, semester, file });
    } catch {
      setError("Не удалось прочитать файл. Попробуйте выбрать его снова.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Новое расписание</DialogTitle>
          <DialogDescription>
            Прикрепите PDF для одного курса и выберите учебный период.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Учебный год">
              <input
                required
                className={fieldClass}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026/2027"
                maxLength={9}
              />
            </Field>
            <SelectField
              label="Курс"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} курс
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Семестр"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="1">1 семестр</option>
              <option value="2">2 семестр</option>
            </SelectField>
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length > 1) {
                setError("Выберите один PDF.");
                return;
              }
              choose(e.dataTransfer.files[0]);
            }}
            className={`rounded-2xl border-2 border-dashed p-7 text-center ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50/70"}`}
          >
            {file ? (
              <FileText className="mx-auto mb-3 size-9 text-blue-600" />
            ) : (
              <UploadCloud className="mx-auto mb-3 size-9 text-blue-500" />
            )}
            <p className="break-all text-sm font-semibold text-gray-900">
              {file ? file.name : "Перетащите PDF сюда"}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} МБ · файл выбран локально`
                : "Один файл · до 20 МБ"}
            </p>
            <input
              ref={picker}
              className="sr-only"
              tabIndex={-1}
              type="file"
              accept=".pdf,application/pdf"
              aria-label="PDF расписания"
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              type="button"
              className="mt-4 bg-white"
              onClick={() => picker.current?.click()}
            >
              {file ? "Заменить файл" : "Выбрать файл"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button disabled={busy} type="submit">
              {busy ? "Проверка файла…" : "Создать черновик"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
