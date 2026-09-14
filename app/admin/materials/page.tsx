"use client";

import { FormEvent, useMemo, useState } from "react";

type MaterialType =
  "Лекция" | "Лабораторная" | "Практическая работа" | "Книга" | "Другое";

type MaterialStatus = "Опубликован" | "Скрыт";

type Material = {
  id: number;
  title: string;
  fileName: string;
  subject: string;
  type: MaterialType;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  status: MaterialStatus;
};

type MaterialForm = {
  title: string;
  subject: string;
  type: MaterialType;
  uploadedBy: string;
  file: File | null;
};

const initialMaterials: Material[] = [
  {
    id: 1,
    title: "Введение в базы данных",
    fileName: "database-introduction.pdf",
    subject: "Базы данных",
    type: "Лекция",
    uploadedBy: "Андрей Русу",
    uploadedAt: "14.09.2026",
    size: "2.4 MB",
    status: "Опубликован",
  },
  {
    id: 2,
    title: "Лабораторная работа №3",
    fileName: "web-lab-3.docx",
    subject: "Web Programming",
    type: "Лабораторная",
    uploadedBy: "Мария Чебан",
    uploadedAt: "12.09.2026",
    size: "840 KB",
    status: "Опубликован",
  },
  {
    id: 3,
    title: "Основы маршрутизации",
    fileName: "network-routing.pdf",
    subject: "Компьютерные сети",
    type: "Лекция",
    uploadedBy: "Виктор Морару",
    uploadedAt: "10.09.2026",
    size: "3.1 MB",
    status: "Скрыт",
  },
  {
    id: 4,
    title: "Практические задания по ООП",
    fileName: "oop-practice.zip",
    subject: "Объектно-ориентированное программирование",
    type: "Практическая работа",
    uploadedBy: "Ирина Попеску",
    uploadedAt: "08.09.2026",
    size: "1.7 MB",
    status: "Опубликован",
  },
  {
    id: 5,
    title: "Сборник задач",
    fileName: "math-problems.pdf",
    subject: "Математический анализ",
    type: "Книга",
    uploadedBy: "Елена Платон",
    uploadedAt: "05.09.2026",
    size: "8.6 MB",
    status: "Опубликован",
  },
];

const emptyForm: MaterialForm = {
  title: "",
  subject: "",
  type: "Лекция",
  uploadedBy: "",
  file: null,
};

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.ceil(sizeInBytes / 1024)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"Все" | MaterialType>("Все");
  const [statusFilter, setStatusFilter] = useState<"Все" | MaterialStatus>(
    "Все",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(
    null,
  );
  const [form, setForm] = useState<MaterialForm>(emptyForm);

  const filteredMaterials = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return materials.filter((material) => {
      const matchesSearch =
        material.title.toLowerCase().includes(normalizedSearch) ||
        material.fileName.toLowerCase().includes(normalizedSearch) ||
        material.subject.toLowerCase().includes(normalizedSearch) ||
        material.uploadedBy.toLowerCase().includes(normalizedSearch);

      const matchesType = typeFilter === "Все" || material.type === typeFilter;

      const matchesStatus =
        statusFilter === "Все" || material.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [materials, search, typeFilter, statusFilter]);

  function openCreateModal() {
    setEditingMaterialId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(material: Material) {
    setEditingMaterialId(material.id);
    setForm({
      title: material.title,
      subject: material.subject,
      type: material.type,
      uploadedBy: material.uploadedBy,
      file: null,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingMaterialId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingMaterialId === null && !form.file) {
      window.alert("Выбери файл для загрузки.");
      return;
    }

    if (editingMaterialId !== null) {
      setMaterials((currentMaterials) =>
        currentMaterials.map((material) =>
          material.id === editingMaterialId
            ? {
                ...material,
                title: form.title.trim(),
                subject: form.subject.trim(),
                type: form.type,
                uploadedBy: form.uploadedBy.trim(),
                fileName: form.file?.name ?? material.fileName,
                size: form.file
                  ? formatFileSize(form.file.size)
                  : material.size,
              }
            : material,
        ),
      );
    } else {
      const selectedFile = form.file;

      if (!selectedFile) {
        return;
      }

      setMaterials((currentMaterials) => [
        {
          id: Date.now(),
          title: form.title.trim(),
          fileName: selectedFile.name,
          subject: form.subject.trim(),
          type: form.type,
          uploadedBy: form.uploadedBy.trim(),
          uploadedAt: new Date().toLocaleDateString("ru-RU"),
          size: formatFileSize(selectedFile.size),
          status: "Опубликован",
        },
        ...currentMaterials,
      ]);
    }

    closeModal();
  }

  function toggleMaterialStatus(materialId: number) {
    setMaterials((currentMaterials) =>
      currentMaterials.map((material) =>
        material.id === materialId
          ? {
              ...material,
              status:
                material.status === "Опубликован" ? "Скрыт" : "Опубликован",
            }
          : material,
      ),
    );
  }

  function deleteMaterial(material: Material) {
    const isConfirmed = window.confirm(`Удалить материал «${material.title}»?`);

    if (!isConfirmed) return;

    setMaterials((currentMaterials) =>
      currentMaterials.filter((item) => item.id !== material.id),
    );
  }

  function openMaterial(material: Material) {
    window.alert(
      `Открытие файла «${material.fileName}» будет подключено вместе с файловым хранилищем.`,
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Материалы</h2>

            <p className="mt-1 text-sm text-gray-500">
              Управление учебными файлами и доступом студентов
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Добавить материал
          </button>
        </div>

        <div className="grid gap-3 border-b border-gray-200 p-5 md:grid-cols-[1fr_220px_180px]">
          <label>
            <span className="sr-only">Поиск материалов</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Название, файл, дисциплина или автор"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as "Все" | MaterialType)
            }
            aria-label="Фильтр по типу материала"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="Все">Все типы</option>
            <option value="Лекция">Лекции</option>
            <option value="Лабораторная">Лабораторные</option>
            <option value="Практическая работа">Практические работы</option>
            <option value="Книга">Книги</option>
            <option value="Другое">Другое</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "Все" | MaterialStatus)
            }
            aria-label="Фильтр по статусу"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="Все">Все статусы</option>
            <option value="Опубликован">Опубликованные</option>
            <option value="Скрыт">Скрытые</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Материал
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Дисциплина
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Тип
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Автор
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Дата
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Статус
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Действия
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredMaterials.map((material) => (
                <tr
                  key={material.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold uppercase text-blue-700">
                        {material.fileName.split(".").pop()?.slice(0, 4)}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {material.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {material.fileName} · {material.size}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {material.subject}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {material.type}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {material.uploadedBy}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                    {material.uploadedAt}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        material.status === "Опубликован"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {material.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openMaterial(material)}
                        className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                      >
                        Открыть
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(material)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Изменить
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleMaterialStatus(material.id)}
                        className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50"
                      >
                        {material.status === "Опубликован"
                          ? "Скрыть"
                          : "Опубликовать"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteMaterial(material)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMaterials.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">Материалы не найдены</p>
              <p className="mt-1 text-sm text-gray-500">
                Измени поисковый запрос или выбранные фильтры
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-5 py-4">
          <p className="text-sm text-gray-500">
            Найдено материалов: {filteredMaterials.length}
          </p>
        </div>
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="material-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="material-modal-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {editingMaterialId === null
                    ? "Новый материал"
                    : "Редактирование материала"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Добавь информацию и выбери учебный файл
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Закрыть окно"
                className="rounded-lg px-2 py-1 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Название
                </span>

                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="Например, Лекция №5"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Дисциплина
                </span>

                <input
                  required
                  value={form.subject}
                  onChange={(event) =>
                    setForm({ ...form, subject: event.target.value })
                  }
                  placeholder="Например, Базы данных"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Тип материала
                </span>

                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value as MaterialType,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Лекция">Лекция</option>
                  <option value="Лабораторная">Лабораторная</option>
                  <option value="Практическая работа">
                    Практическая работа
                  </option>
                  <option value="Книга">Книга</option>
                  <option value="Другое">Другое</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Автор
                </span>

                <input
                  required
                  value={form.uploadedBy}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      uploadedBy: event.target.value,
                    })
                  }
                  placeholder="Имя преподавателя"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Файл
                  {editingMaterialId !== null &&
                    " — необязательно при редактировании"}
                </span>

                <input
                  type="file"
                  required={editingMaterialId === null}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      file: event.target.files?.[0] ?? null,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
              </label>

              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                Допустимые форматы: PDF, Word, PowerPoint, Excel и ZIP. Реальная
                загрузка файла появится после подключения серверного хранилища.
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingMaterialId === null ? "Добавить" : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
