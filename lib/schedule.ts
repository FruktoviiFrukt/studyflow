export const UNIVERSITY_TIME_ZONE = "Europe/Chisinau";

// UTC date-only values avoid DST and browser time zone shifts during navigation.
export function universityToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UNIVERSITY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function parseDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}
export function addDays(date: string, days: number): string {
  const result = parseDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}
export function mondayOf(date: string): string {
  return addDays(date, -((parseDate(date).getUTCDay() + 6) % 7));
}
export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("ru-RU", {
    ...options,
    timeZone: "UTC",
  }).format(parseDate(date));
}
export function weekLabel(monday: string): string {
  return `${formatDate(monday, { day: "numeric", month: "short" })} — ${formatDate(addDays(monday, 4), { day: "numeric", month: "short", year: "numeric" })}`;
}
export const weekdays = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
];
export const shortWeekdays = ["Пн", "Вт", "Ср", "Чт", "Пт"];
export const timeSlots = [
  { start: "08:00", end: "09:30" },
  { start: "09:45", end: "11:15" },
  { start: "11:30", end: "13:00" },
  { start: "13:30", end: "15:00" },
  { start: "15:15", end: "16:45" },
] as const;
export const subjects = {
  programming: {
    name: "Программирование",
    color: "border-l-blue-500 bg-blue-50 text-blue-950",
    dot: "bg-blue-500",
  },
  math: {
    name: "Высшая математика",
    color: "border-l-violet-500 bg-violet-50 text-violet-950",
    dot: "bg-violet-500",
  },
  databases: {
    name: "Базы данных",
    color: "border-l-emerald-500 bg-emerald-50 text-emerald-950",
    dot: "bg-emerald-500",
  },
  networks: {
    name: "Компьютерные сети",
    color: "border-l-amber-500 bg-amber-50 text-amber-950",
    dot: "bg-amber-500",
  },
  english: {
    name: "Английский язык",
    color: "border-l-rose-500 bg-rose-50 text-rose-950",
    dot: "bg-rose-500",
  },
} as const;
export type Lesson = {
  id: string;
  date: string;
  slot: number;
  subject: keyof typeof subjects;
  type:
    | "Лекция"
    | "Лабораторная"
    | "Семинар"
    | "Практика"
    | "Аттестация 1"
    | "Аттестация 2"
    | "Переаттестация"
    | "Экзамен";
  classroom: string;
  teacher: string;
  topic: string;
};
type TemplateLesson = Omit<Lesson, "id" | "date"> & { day: number };
// Recurring frontend fixtures only, not the real university timetable.
// Replace this provider with dated API records when the backend is available.
const demoWeek: TemplateLesson[] = [
  {
    day: 0,
    slot: 0,
    subject: "programming",
    type: "Лекция",
    classroom: "3-301",
    teacher: "Ион Попеску",
    topic: "Объектно-ориентированное программирование",
  },
  {
    day: 0,
    slot: 1,
    subject: "math",
    type: "Практика",
    classroom: "3-214",
    teacher: "Елена Русу",
    topic: "Дифференциальные уравнения",
  },
  {
    day: 0,
    slot: 3,
    subject: "databases",
    type: "Лабораторная",
    classroom: "3-407",
    teacher: "Андрей Чобану",
    topic: "Проектирование реляционной базы данных",
  },
  {
    day: 1,
    slot: 1,
    subject: "networks",
    type: "Лекция",
    classroom: "3-302",
    teacher: "Виктор Мунтяну",
    topic: "Модель OSI и сетевые протоколы",
  },
  {
    day: 1,
    slot: 2,
    subject: "english",
    type: "Практика",
    classroom: "3-205",
    teacher: "Мария Кожокару",
    topic: "Technical communication",
  },
  {
    day: 1,
    slot: 3,
    subject: "programming",
    type: "Лабораторная",
    classroom: "3-410",
    teacher: "Ион Попеску",
    topic: "Классы, интерфейсы и наследование",
  },
  {
    day: 2,
    slot: 0,
    subject: "math",
    type: "Лекция",
    classroom: "3-214",
    teacher: "Елена Русу",
    topic: "Ряды и их сходимость",
  },
  {
    day: 2,
    slot: 1,
    subject: "databases",
    type: "Лекция",
    classroom: "3-301",
    teacher: "Андрей Чобану",
    topic: "Нормализация данных",
  },
  {
    day: 2,
    slot: 2,
    subject: "networks",
    type: "Лабораторная",
    classroom: "3-408",
    teacher: "Виктор Мунтяну",
    topic: "Настройка локальной сети",
  },
  {
    day: 3,
    slot: 1,
    subject: "programming",
    type: "Семинар",
    classroom: "3-310",
    teacher: "Ион Попеску",
    topic: "Разбор архитектуры приложения",
  },
  {
    day: 3,
    slot: 2,
    subject: "math",
    type: "Практика",
    classroom: "3-214",
    teacher: "Елена Русу",
    topic: "Решение задач на ряды",
  },
  {
    day: 3,
    slot: 4,
    subject: "english",
    type: "Практика",
    classroom: "3-205",
    teacher: "Мария Кожокару",
    topic: "Presenting a software project",
  },
  {
    day: 4,
    slot: 0,
    subject: "databases",
    type: "Лабораторная",
    classroom: "3-407",
    teacher: "Андрей Чобану",
    topic: "SQL: выборки и объединения",
  },
  {
    day: 4,
    slot: 1,
    subject: "networks",
    type: "Семинар",
    classroom: "3-302",
    teacher: "Виктор Мунтяну",
    topic: "Адресация IPv4 и подсети",
  },
];
export function getDemoLessons(monday: string): Lesson[] {
  return demoWeek.map(({ day, ...lesson }, index) => ({
    ...lesson,
    id: `${monday}-${index}`,
    date: addDays(monday, day),
  }));
}
