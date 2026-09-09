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
  Pencil,
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
} from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TaskDialog from "@/components/tasks/task-dialog";
import {
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/tasks";
import { Progress } from "@/components/ui/progress";

/* ------------------------------------------------------------------ */
/*  Types & Interfaces                                                */
/* ------------------------------------------------------------------ */
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

const STATUS_FILTERS = [{ value: "all", label: "Все" }, ...TASK_STATUSES];

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
      aria-label="Перевести в работу"
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
  onEdit: (task: Task) => void;
}

function TaskCard({ task, onCycleStatus, onEdit }: TaskCardProps) {
  const priority = PRIORITY_META[task.priority];
  const status = STATUS_META[task.status];
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      className={cn(
        "relative flex min-w-0 items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-200 sm:gap-4 sm:p-5",
        task.status === "done" && "bg-gray-50/70",
      )}
    >
      <div className="pt-0.5">
        <StatusToggle
          status={task.status}
          onToggle={() => onCycleStatus(task.id)}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2 pr-8">
          <span className="break-words text-xs font-semibold tracking-wide text-blue-600">
            {task.subject.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">· {task.type}</span>
        </div>

        <h3
          className={cn(
            "break-words pr-8 font-semibold text-base leading-snug text-gray-900",
            task.status === "done" && "line-through opacity-60",
          )}
        >
          {task.title}
        </h3>

        {task.notes && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-500">
            {task.notes}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant={priority.variant}>{priority.label}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
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

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 text-gray-400 hover:text-blue-600"
        aria-label={`Редактировать задание: ${task.title}`}
        onClick={() => onEdit(task)}
      >
        <Pencil aria-hidden="true" size={16} />
      </Button>
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
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function TasksPage() {
  const [subjects, setSubjects] = useState<string[]>(INITIAL_SUBJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [taskDialog, setTaskDialog] = useState<{ task?: Task } | null>(null);
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

  function saveTask(data: TaskInput) {
    setTasks((previous) =>
      taskDialog?.task
        ? previous.map((task) =>
            task.id === taskDialog.task?.id ? { ...task, ...data } : task,
          )
        : [
            {
              id: Math.max(0, ...previous.map((task) => task.id)) + 1,
              ...data,
            },
            ...previous,
          ],
    );
    setTaskDialog(null);
  }

  function deleteTask(id: number) {
    setTasks((previous) => previous.filter((task) => task.id !== id));
    setTaskDialog(null);
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
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              ТРЕКЕР ЗАДАНИЙ
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Задания
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Все дедлайны и работы по твоим предметам в одном месте.
            </p>
          </div>

          <Button
            onClick={() => setTaskDialog({})}
            size="default"
            className="shrink-0 rounded-lg"
          >
            <Plus size={18} />
            Добавить задание
          </Button>
        </div>

        {/* Semester progress */}
        <Card className="mb-6 rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 p-5 sm:p-6">
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
          <CardContent className="px-5 sm:px-6">
            <Progress
              value={counts.percent}
              aria-label="Выполнение заданий за семестр"
            />

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-white/80 p-3.5">
                <CheckCircle2 size={20} className="text-primary" />
                <div>
                  <div className="text-xl font-bold text-card-foreground">
                    {counts.done}
                  </div>
                  <div className="text-xs text-muted-foreground">Выполнено</div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-white/80 p-3.5">
                <Loader2 size={20} className="text-muted-foreground" />
                <div>
                  <div className="text-xl font-bold text-card-foreground">
                    {counts.inProgress}
                  </div>
                  <div className="text-xs text-muted-foreground">В работе</div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-white/80 p-3.5">
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
        <div className="mb-5 flex flex-col flex-wrap gap-3 xl:flex-row xl:items-center">
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
        <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
          <CardContent className="p-3 sm:p-5">
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
                    onEdit={(task) => setTaskDialog({ task })}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {taskDialog && (
        <TaskDialog
          task={taskDialog.task}
          subjects={subjects}
          onClose={() => setTaskDialog(null)}
          onSave={saveTask}
          onDelete={deleteTask}
        />
      )}

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
