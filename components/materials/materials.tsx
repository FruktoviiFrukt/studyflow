"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MaterialCard from "./material-card";
import UploadMaterialDialog, {
  type NewMaterialPayload,
} from "./upload-material-dialog";
import { SUBJECTS, type Material } from "./types";

const INITIAL_MATERIALS: Material[] = [
  {
    id: "m1",
    title: "Лабораторная работа №4 — основы ООП",
    subject: "Программирование",
    type: "pdf",
    size: 2_450_000,
    uploadedAt: "2026-09-02T10:20:00",
  },
  {
    id: "m2",
    title: "Конспект лекций: пределы и производные",
    subject: "Высшая математика",
    type: "docx",
    size: 840_000,
    uploadedAt: "2026-09-01T16:05:00",
  },
  {
    id: "m3",
    title: "ER-диаграмма учебной базы",
    subject: "Базы данных",
    type: "png",
    size: 1_120_000,
    uploadedAt: "2026-08-28T09:12:00",
  },
  {
    id: "m4",
    title: "Презентация: модель OSI",
    subject: "Компьютерные сети",
    type: "pptx",
    size: 8_120_000,
    uploadedAt: "2026-08-26T14:40:00",
  },
  {
    id: "m5",
    title: "Таблица SQL-запросов",
    subject: "Базы данных",
    type: "xlsx",
    size: 180_000,
    uploadedAt: "2026-08-21T11:00:00",
  },
];

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function Materials() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Material | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.type.includes(q);
      return matchesQuery && (subject === "all" || item.subject === subject);
    });
  }, [materials, query, subject]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  }

  function handleUpload(payload: NewMaterialPayload) {
    setMaterials((current) => [
      {
        id: crypto.randomUUID(),
        title: payload.title,
        subject: payload.subject,
        type: payload.type,
        size: payload.size,
        uploadedAt: new Date().toISOString(),
        file: payload.file,
      },
      ...current,
    ]);
    showNotice("Материал загружен");
  }

  function handleOpen(material: Material) {
    if (material.file) {
      window.open(
        URL.createObjectURL(material.file),
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    showNotice(`Открыт материал: ${material.title}`);
  }

  function handleDownload(material: Material) {
    if (material.file) {
      const url = URL.createObjectURL(material.file);
      const link = document.createElement("a");
      link.href = url;
      link.download = material.file.name;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    showNotice(`Скачивание: ${material.title}`);
  }

  const hasFilters = query.trim().length > 0 || subject !== "all";

  return (
    <div className="mx-auto max-w-7xl">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Учебные файлы
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Материалы
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Конспекты, презентации и задания по предметам. Можно открыть,
            скачать или подготовить с ИИ.
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setUploadOpen(true)}>
          <Upload />
          Загрузить материал
        </Button>
      </section>

      <section className="mb-5 flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Поиск материалов</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск материалов по названию…"
            className={`${inputClass} pl-9`}
          />
        </label>
        <label className="w-full lg:w-64">
          <span className="sr-only">Фильтр по предмету</span>
          <select
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={inputClass}
          >
            <option value="all">Все предметы</option>
            {SUBJECTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </section>

      {notice && (
        <p className="mb-4 text-sm font-medium text-blue-700">{notice}</p>
      )}

      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-10 text-center shadow-none">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpen size={26} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {hasFilters ? "Ничего не найдено" : "Пока нет материалов"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {hasFilters
              ? "Измените запрос или сбросьте фильтр по предмету."
              : "Загрузите первый файл — конспект, презентацию или задание."}
          </p>
          <div className="mt-5">
            {hasFilters ? (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setQuery("");
                  setSubject("all");
                }}
              >
                Сбросить фильтры
              </Button>
            ) : (
              <Button
                className="rounded-xl"
                onClick={() => setUploadOpen(true)}
              >
                <Upload />
                Загрузить материал
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Показано {filtered.length} из {materials.length}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onOpen={handleOpen}
                onDownload={handleDownload}
                onPrepare={() =>
                  router.push(
                    `/ai-coach?material=${encodeURIComponent(material.id)}`,
                  )
                }
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        </>
      )}

      <UploadMaterialDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmit={handleUpload}
      />

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Удалить материал?</DialogTitle>
            <DialogDescription>
              «{pendingDelete?.title}» будет удалён. Это действие нельзя
              отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setPendingDelete(null)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                if (!pendingDelete) return;
                setMaterials((current) =>
                  current.filter((item) => item.id !== pendingDelete.id),
                );
                showNotice("Материал удалён");
                setPendingDelete(null);
              }}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
