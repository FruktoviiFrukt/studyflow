export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id: number;
  title: string;
  subject: string;
  type: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  notes?: string;
}

export type TaskInput = Omit<Task, "id">;
export type TaskErrors = Partial<Record<keyof TaskInput, string>>;

export const TASK_TYPES = [
  "Домашнее задание",
  "Лабораторная",
  "Практика",
  "Контрольная",
  "Отчёт",
  "Курсовой проект",
  "Реферат",
  "Другое",
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Нужно сделать" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Выполнено" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "Высокий" },
  { value: "medium", label: "Средний" },
  { value: "low", label: "Низкий" },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: "Лабораторная работа №4",
    subject: "Программирование",
    type: "Лабораторная",
    priority: "high",
    dueDate: "2026-09-09",
    status: "todo",
    notes: "",
  },
  {
    id: 2,
    title: "Практическая работа",
    subject: "Базы данных",
    type: "Практика",
    priority: "medium",
    dueDate: "2026-09-11",
    status: "in_progress",
    notes: "",
  },
  {
    id: 3,
    title: "Отчёт по лабораторной",
    subject: "Компьютерные сети",
    type: "Отчёт",
    priority: "medium",
    dueDate: "2026-09-13",
    status: "todo",
    notes: "",
  },
  {
    id: 4,
    title: "Контрольная работа №2",
    subject: "Высшая математика",
    type: "Контрольная",
    priority: "high",
    dueDate: "2026-09-10",
    status: "in_progress",
    notes: "",
  },
  {
    id: 5,
    title: "Домашнее задание: указатели",
    subject: "Программирование",
    type: "Домашнее задание",
    priority: "low",
    dueDate: "2026-09-15",
    status: "done",
    notes: "",
  },
  {
    id: 6,
    title: "Курсовой проект: этап 1",
    subject: "Базы данных",
    type: "Курсовой проект",
    priority: "high",
    dueDate: "2026-09-20",
    status: "todo",
    notes: "",
  },
  {
    id: 7,
    title: "Реферат по сетевым протоколам",
    subject: "Компьютерные сети",
    type: "Реферат",
    priority: "low",
    dueDate: "2026-09-05",
    status: "done",
    notes: "",
  },
  {
    id: 8,
    title: "Практическая работа №3",
    subject: "Высшая математика",
    type: "Практика",
    priority: "medium",
    dueDate: "2026-09-08",
    status: "done",
    notes: "",
  },
];

export function localToday(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function validateTask(
  input: TaskInput,
  subjects: string[],
  types: string[] = TASK_TYPES,
): TaskErrors {
  const errors: TaskErrors = {};
  if (!input.title.trim()) errors.title = "Введите название задания.";
  else if (input.title.trim().length > 160)
    errors.title = "Название должно быть не длиннее 160 символов.";
  if (!subjects.includes(input.subject))
    errors.subject = "Выберите предмет из списка.";
  if (!types.includes(input.type)) errors.type = "Выберите тип задания.";
  if (!TASK_PRIORITIES.some((option) => option.value === input.priority))
    errors.priority = "Выберите приоритет.";
  if (!TASK_STATUSES.some((option) => option.value === input.status))
    errors.status = "Выберите статус.";
  const date = new Date(`${input.dueDate}T12:00:00`);
  const [year, month, day] = input.dueDate.split("-").map(Number);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ||
    year < 1 ||
    !Number.isFinite(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    errors.dueDate = "Укажите корректную дату дедлайна.";
  }
  if ((input.notes ?? "").length > 2000)
    errors.notes = "Описание должно быть не длиннее 2000 символов.";
  return errors;
}
