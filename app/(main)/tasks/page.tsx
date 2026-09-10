"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Plus,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Check,
  Settings,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

/* ------------------------------------------------------------------ */
/*  Types & Interfaces                                                */
/* ------------------------------------------------------------------ */
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

export type CreateTaskInput = Omit<Task, "id" | "status">;

export interface SelectOption {
  value: string;
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Custom Select Component                                           */
/* ------------------------------------------------------------------ */
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block w-full", className)}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-sm text-card-foreground shadow-xs transition-all hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown
          size={15}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full rounded-xl border border-border/60 bg-card p-1.5 shadow-lg backdrop-blur-sm animate-in fade-in-50 zoom-in-95 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                value === option.value &&
                  "bg-accent/80 font-medium text-primary",
              )}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && (
                <Check size={14} className="text-primary shrink-0 ml-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock data & Meta                                                  */
/* ------------------------------------------------------------------ */
const INITIAL_SUBJECTS = [
  "Программирование",
  "Высшая математика",
  "Базы данных",
  "Компьютерные сети",
];

const INITIAL_TASKS: Task[] = [
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

const STATUS_FILTERS = [
  { value: "all", label: "Все" },
  { value: "todo", label: "Нужно сделать" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Выполнено" },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "Высокий" },
  { value: "medium", label: "Средний" },
  { value: "low", label: "Низкий" },
];

const STATUS_ORDER: Record<TaskStatus, number> = {
  in_progress: 0,
  todo: 1,
  done: 2,
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; variant: BadgeVariant }
> = {
  high: { label: "Высокий", variant: "destructive" },
  medium: { label: "Средний", variant: "secondary" },
  low: { label: "Низкий", variant: "outline" },
};

const STATUS_META: Record<
  TaskStatus,
  { label: string; variant: BadgeVariant }
> = {
  todo: { label: "Нужно сделать", variant: "outline" },
  in_progress: { label: "В работе", variant: "default" },
  done: { label: "Выполнено", variant: "secondary" },
};

function formatDate(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function isOverdue(iso: string, status: TaskStatus): boolean {
  if (status === "done" || !iso) return false;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskDate = new Date(year, month - 1, day);
  return taskDate < today;
}

/* ------------------------------------------------------------------ */
/*  Status toggle                                                     */
/* ------------------------------------------------------------------ */
interface StatusToggleProps {
  status: TaskStatus;
  onToggle: () => void;
}

function StatusToggle({ status, onToggle }: StatusToggleProps) {
  if (status === "done") {
    return (
      <button
        onClick={onToggle}
        aria-label="Отметить как невыполненное"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground transition-transform active:scale-95"
      >
        <CheckCircle2 size={16} strokeWidth={2.5} />
      </button>
    );
  }
  if (status === "in_progress") {
    return (
      <button
        onClick={onToggle}
        aria-label="Отметить как выполненное"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary bg-accent transition-transform active:scale-95"
      >
        <Loader2
          size={13}
          className="text-primary animate-spin"
          strokeWidth={3}
        />
      </button>
    );
  }
  return (
    <button
      onClick={onToggle}
      aria-label="Отметить как выполненное"
      className="shrink-0 w-6 h-6 rounded-full border-2 border-input hover:border-primary transition-colors active:scale-95"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Task row                                                          */
/* ------------------------------------------------------------------ */
interface TaskCardProps {
  task: Task;
  onCycleStatus: (id: number) => void;
}

function TaskCard({ task, onCycleStatus }: TaskCardProps) {
  const priority = PRIORITY_META[task.priority];
  const status = STATUS_META[task.status];
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className="rounded-2xl p-4 sm:p-5 flex items-start gap-4 bg-card border border-border/60 shadow-xs hover:border-primary/30 transition-all">
      <div className="pt-0.5">
        <StatusToggle
          status={task.status}
          onToggle={() => onCycleStatus(task.id)}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-semibold tracking-wide text-primary">
            {task.subject.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">· {task.type}</span>
        </div>

        <h3
          className={cn(
            "font-semibold text-base sm:text-lg leading-snug text-card-foreground",
            task.status === "done" && "line-through opacity-60",
          )}
        >
          {task.title}
        </h3>

        <div className="flex flex-wrap items-center gap-3 mt-2.5">
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              overdue ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Clock size={14} />
            {formatDate(task.dueDate)}
            {overdue && " · Просрочено"}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <Badge variant={priority.variant}>{priority.label}</Badge>
        <Badge variant={status.variant} className="hidden sm:inline-flex">
          {status.label}
        </Badge>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Manage Subjects Dialog                                            */
/* ------------------------------------------------------------------ */
interface ManageSubjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: string[];
  onAddSubject: (name: string) => void;
  onDeleteSubject: (name: string) => void;
}

function ManageSubjectsDialog({
  open,
  onOpenChange,
  subjects,
  onAddSubject,
  onDeleteSubject,
}: ManageSubjectsDialogProps) {
  const [newSubject, setNewSubject] = useState("");

  function handleAdd() {
    const trimmed = newSubject.trim();
    if (trimmed) {
      onAddSubject(trimmed);
      setNewSubject("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Управление предметами</DialogTitle>
          <DialogDescription>
            Добавляй новые учебные дисциплины или удаляй устаревшие.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Form to add */}
          <div className="flex gap-2">
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Название предмета..."
              className="flex h-9 w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm text-card-foreground shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              type="button"
              onClick={handleAdd}
              size="sm"
              className="rounded-xl shrink-0"
              disabled={!newSubject.trim()}
            >
              <Plus size={16} />
              Добавить
            </Button>
          </div>

          {/* List of subjects */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Список предметов пуст.
              </p>
            ) : (
              subjects.map((subj) => (
                <div
                  key={subj}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-2.5 px-3 text-sm text-card-foreground"
                >
                  <span className="font-medium">{subj}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteSubject(subj)}
                    title="Удалить предмет"
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Готово
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  New task dialog                                                   */
/* ------------------------------------------------------------------ */
interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: string[];
  onCreate: (data: CreateTaskInput) => void;
  onOpenManageSubjects: () => void;
}

function NewTaskDialog({
  open,
  onOpenChange,
  subjects,
  onCreate,
  onOpenManageSubjects,
}: NewTaskDialogProps) {
  const getToday = () => new Date().toISOString().split("T")[0];
  const getDefaultSubject = () =>
    subjects.length > 0 ? subjects[0] : "Без предмета";

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(getDefaultSubject);
  const [type, setType] = useState("Домашнее задание");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState(getToday);
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setTitle("");
    setSubject(getDefaultSubject());
    setType("Домашнее задание");
    setPriority("medium");
    setDueDate(getToday());
    setNotes("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSubject(getDefaultSubject());
      setDueDate(getToday());
    } else {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const canSubmit = title.trim().length > 0 && dueDate.length > 0;
  const inputClasses =
    "flex h-9 w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-card-foreground";

  const subjectOptions: SelectOption[] = (
    subjects.length > 0 ? subjects : ["Без предмета"]
  ).map((s) => ({ value: s, label: s }));

  function handleSubmit() {
    if (!canSubmit) return;
    onCreate({
      title: title.trim(),
      subject: subject || "Без предмета",
      type,
      priority,
      dueDate,
      notes: notes.trim(),
    });
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl border-border/60">
        <DialogHeader>
          <DialogTitle>Новый дедлайн</DialogTitle>
          <DialogDescription>
            Заполни детали задания, чтобы добавить его в трекер.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5 text-card-foreground">
              Название задания
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Лабораторная работа №5"
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-card-foreground">
                  Предмет
                </label>
                <button
                  type="button"
                  onClick={onOpenManageSubjects}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  + Изменить
                </button>
              </div>
              <CustomSelect
                value={subject}
                onChange={setSubject}
                options={subjectOptions}
                placeholder="Выберите предмет"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5 text-card-foreground">
                Тип
              </label>
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5 text-card-foreground">
              Приоритет
            </label>
            <SegmentedControl
              ariaLabel="Приоритет задания"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(val) => setPriority(val as TaskPriority)}
              fullWidthOnMobile
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5 text-card-foreground">
              Дедлайн
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5 text-card-foreground">
              Комментарий{" "}
              <span className="text-muted-foreground font-normal">
                (необязательно)
              </span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Что нужно сделать, на что обратить внимание..."
              className="min-h-[70px] rounded-xl border-border/60"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </DialogClose>
          <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
            Добавить задание
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function TasksPage() {
  const [subjects, setSubjects] = useState<string[]>(INITIAL_SUBJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [manageSubjectsOpen, setManageSubjectsOpen] = useState<boolean>(false);

  const subjectFilterOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "all", label: "Все предметы" },
      ...subjects.map((s) => ({ value: s, label: s })),
      { value: "Без предмета", label: "Без предмета" },
    ];
  }, [subjects]);

  const counts = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const remaining = tasks.filter((t) => t.status !== "done").length;
    const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return { done, inProgress, remaining, percent, total: tasks.length };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => statusFilter === "all" || t.status === statusFilter)
      .filter((t) => subjectFilter === "all" || t.subject === subjectFilter)
      .sort((a, b) => {
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, statusFilter, subjectFilter]);

  function cycleStatus(id: number) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next: TaskStatus =
          t.status === "todo"
            ? "in_progress"
            : t.status === "in_progress"
              ? "done"
              : "todo";
        return { ...t, status: next };
      }),
    );
  }

  function createTask(data: CreateTaskInput) {
    const uniqueNumericId = Date.now() + Math.floor(Math.random() * 1000);
    setTasks((prev) => [
      { id: uniqueNumericId, status: "todo", ...data },
      ...prev,
    ]);
    setDialogOpen(false);
  }

  function handleAddSubject(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = subjects.some(
      (s) => s.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (!exists) {
      setSubjects((prev) => [...prev, trimmed]);
    }
  }

  function handleDeleteSubject(name: string) {
    setSubjects((prev) => prev.filter((s) => s !== name));
    if (subjectFilter === name) {
      setSubjectFilter("all");
    }
    setTasks((prev) =>
      prev.map((task) =>
        task.subject === name ? { ...task, subject: "Без предмета" } : task,
      ),
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold tracking-wide text-primary">
              ТРЕКЕР ЗАДАНИЙ
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-1 text-foreground">
              Задания
            </h1>
            <p className="text-sm mt-1 text-muted-foreground">
              Все дедлайны и работы по твоим предметам в одном месте.
            </p>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            size="lg"
            className="shrink-0 rounded-xl shadow-xs"
          >
            <Plus size={18} />
            Добавить задание
          </Button>
        </div>

        {/* Semester progress */}
        <Card className="mb-6 rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Прогресс за семестр</CardTitle>
              <CardDescription>
                {counts.done} из {counts.total} заданий выполнено
              </CardDescription>
            </div>
            <div className="text-3xl font-extrabold text-primary">
              {counts.percent}%
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={counts.percent} />

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="rounded-xl p-3.5 flex items-center gap-3 bg-muted/60 border border-border/40">
                <CheckCircle2 size={20} className="text-primary" />
                <div>
                  <div className="text-xl font-bold text-card-foreground">
                    {counts.done}
                  </div>
                  <div className="text-xs text-muted-foreground">Выполнено</div>
                </div>
              </div>
              <div className="rounded-xl p-3.5 flex items-center gap-3 bg-muted/60 border border-border/40">
                <Loader2 size={20} className="text-muted-foreground" />
                <div>
                  <div className="text-xl font-bold text-card-foreground">
                    {counts.inProgress}
                  </div>
                  <div className="text-xs text-muted-foreground">В работе</div>
                </div>
              </div>
              <div className="rounded-xl p-3.5 flex items-center gap-3 bg-muted/60 border border-border/40">
                <Clock size={20} className="text-muted-foreground" />
                <div>
                  <div className="text-xl font-bold text-card-foreground">
                    {counts.remaining}
                  </div>
                  <div className="text-xs text-muted-foreground">Осталось</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <SegmentedControl
            ariaLabel="Фильтр по статусу"
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
            fullWidthOnMobile
          />

          <div className="sm:ml-auto flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-52">
              <CustomSelect
                value={subjectFilter}
                onChange={setSubjectFilter}
                options={subjectFilterOptions}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setManageSubjectsOpen(true)}
              title="Управление предметами"
              className="rounded-xl shrink-0 border-border/60"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        {/* Task list */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardContent className="pt-6">
            {filteredTasks.length === 0 ? (
              <div className="py-14 text-center">
                <p className="font-semibold text-card-foreground">
                  Здесь пока пусто
                </p>
                <p className="text-sm mt-1 text-muted-foreground">
                  Под этот фильтр заданий не найдено.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onCycleStatus={cycleStatus}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subjects={subjects}
        onCreate={createTask}
        onOpenManageSubjects={() => setManageSubjectsOpen(true)}
      />

      <ManageSubjectsDialog
        open={manageSubjectsOpen}
        onOpenChange={setManageSubjectsOpen}
        subjects={subjects}
        onAddSubject={handleAddSubject}
        onDeleteSubject={handleDeleteSubject}
      />
    </div>
  );
}
