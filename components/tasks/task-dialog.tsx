"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  localToday,
  validateTask,
  type Task,
  type TaskInput,
  type TaskErrors,
} from "@/lib/tasks";

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-invalid:border-red-500 aria-invalid:focus:ring-red-100";

function Field({
  name,
  label,
  error,
  children,
}: {
  name: keyof TaskInput;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={`task-${name}`}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`task-${name}-error`}
          className="mt-1.5 text-xs text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default function TaskDialog({
  task,
  subjects,
  onClose,
  onSave,
  onDelete,
}: {
  task?: Task;
  subjects: string[];
  onClose: () => void;
  onSave: (data: TaskInput) => void;
  onDelete: (id: number) => void;
}) {
  const subjectOptions = [
    ...new Set([...subjects, ...(task ? [task.subject] : []), "Без предмета"]),
  ];
  const typeOptions = [
    ...new Set([...TASK_TYPES, ...(task ? [task.type] : [])]),
  ];
  const [draft, setDraft] = useState<TaskInput>(() =>
    task
      ? {
          title: task.title,
          subject: task.subject,
          type: task.type,
          priority: task.priority,
          dueDate: task.dueDate,
          status: task.status,
          notes: task.notes ?? "",
        }
      : {
          title: "",
          subject: subjects[0] ?? "Без предмета",
          type: "Домашнее задание",
          priority: "medium",
          dueDate: localToday(),
          status: "todo",
          notes: "",
        },
  );
  const [errors, setErrors] = useState<TaskErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  function update<K extends keyof TaskInput>(name: K, value: TaskInput[K]) {
    setDraft((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  function fieldProps(name: keyof TaskInput) {
    return {
      id: `task-${name}`,
      name,
      className: inputClass,
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `task-${name}-error` : undefined,
    };
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateTask(draft, subjectOptions, typeOptions);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      event.currentTarget
        .querySelector<HTMLElement>(`#task-${firstError}`)
        ?.focus();
      return;
    }
    onSave({
      ...draft,
      title: draft.title.trim(),
      notes: draft.notes?.trim() ?? "",
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl gap-0 overflow-y-auto rounded-2xl border-gray-200 bg-white p-0">
        <DialogHeader className="border-b border-gray-100 p-5 pr-12 text-left sm:p-6 sm:pr-12">
          <DialogTitle>
            {task ? "Редактировать задание" : "Добавить задание"}
          </DialogTitle>
          <DialogDescription>
            {task
              ? "Измените детали задания и сохраните изменения."
              : "Укажите предмет, дедлайн и остальные детали задания."}
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit}>
          <div className="space-y-4 p-5 sm:p-6">
            <Field name="title" label="Название задания" error={errors.title}>
              <input
                {...fieldProps("title")}
                autoFocus
                required
                maxLength={160}
                placeholder="Например, лабораторная работа №5"
                value={draft.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="subject" label="Предмет" error={errors.subject}>
                <select
                  {...fieldProps("subject")}
                  required
                  value={draft.subject}
                  onChange={(event) => update("subject", event.target.value)}
                >
                  {subjectOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Field>
              <Field name="type" label="Тип задания" error={errors.type}>
                <select
                  {...fieldProps("type")}
                  required
                  value={draft.type}
                  onChange={(event) => update("type", event.target.value)}
                >
                  {typeOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Field>
              <Field name="priority" label="Приоритет" error={errors.priority}>
                <select
                  {...fieldProps("priority")}
                  required
                  value={draft.priority}
                  onChange={(event) =>
                    update(
                      "priority",
                      event.target.value as TaskInput["priority"],
                    )
                  }
                >
                  {TASK_PRIORITIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field name="status" label="Статус" error={errors.status}>
                <select
                  {...fieldProps("status")}
                  required
                  value={draft.status}
                  onChange={(event) =>
                    update("status", event.target.value as TaskInput["status"])
                  }
                >
                  {TASK_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field name="dueDate" label="Дедлайн" error={errors.dueDate}>
              <input
                {...fieldProps("dueDate")}
                type="date"
                required
                value={draft.dueDate}
                onChange={(event) => update("dueDate", event.target.value)}
              />
            </Field>
            <Field
              name="notes"
              label="Описание (необязательно)"
              error={errors.notes}
            >
              <textarea
                {...fieldProps("notes")}
                className={`${inputClass} h-auto min-h-24 resize-y py-3`}
                maxLength={2000}
                rows={3}
                placeholder="Что нужно сделать и на что обратить внимание"
                value={draft.notes}
                onChange={(event) => update("notes", event.target.value)}
              />
            </Field>
          </div>
          <div className="space-y-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 p-5 sm:px-6">
            {confirmDelete && task ? (
              <div role="alert" className="space-y-3">
                <p className="break-words text-sm text-gray-700">
                  Удалить задание «{task.title}»?
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Оставить задание
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(task.id)}
                  >
                    Да, удалить
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                {task && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 sm:mr-auto"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Удалить задание
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className={!task ? "sm:ml-auto" : ""}
                  onClick={onClose}
                >
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
