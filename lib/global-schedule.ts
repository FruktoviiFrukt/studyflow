export const globalTimeSlots = [
  { start: "08:00", end: "09:30" },
  { start: "09:45", end: "11:15" },
  { start: "11:30", end: "13:00" },
  { start: "13:30", end: "15:00" },
  { start: "15:15", end: "16:45" },
  { start: "17:00", end: "18:30" },
  { start: "18:45", end: "20:15" },
];
// Group headings from the supplied third-year PDF. Other years are demo names.
const thirdYearGroups = [
  "IA-241",
  "IA-242",
  "IA-243",
  "SD-241",
  "SD-242",
  "TI-241",
  "TI-242",
  "TI-243",
  "TI-244",
  "TI-245",
  "TI-246",
  "FI-241",
  "SI-241",
  "SI-242",
  "SI-243",
  "IBM-241",
  "IBM-242",
  "MN-241",
  "EA-241",
  "AI-241",
  "CR-241",
  "CR-242",
  "CR-243",
  "RM-241",
  "FAF-241",
  "FAF-242",
  "FAF-243",
];
export function groupsForYear(year: number): string[] {
  return thirdYearGroups.map((group) =>
    group.replace(/24(?=\d$)/, String(27 - year)),
  );
}
const courseSubjects: Record<number, string[]> = {
  1: [
    "Математический анализ",
    "Основы программирования",
    "Физика",
    "Английский язык",
    "Линейная алгебра",
  ],
  2: [
    "Алгоритмы и структуры данных",
    "Объектно-ориентированное программирование",
    "Дискретная математика",
    "Компьютерные сети",
    "Веб-технологии",
  ],
  3: [
    "Базы данных",
    "Операционные системы",
    "Управление проектами",
    "Искусственный интеллект",
    "Декларативное программирование",
  ],
  4: [
    "Архитектура ПО",
    "Информационная безопасность",
    "Распределённые системы",
    "Проектирование приложений",
    "Дипломный проект",
  ],
};
export type GlobalCell = {
  group: string;
  span: number;
  subject: string;
  type: string;
  classroom: string;
  color: string;
};
const colors = [
  "bg-blue-50 border-blue-100 text-blue-950",
  "bg-violet-50 border-violet-100 text-violet-950",
  "bg-emerald-50 border-emerald-100 text-emerald-950",
  "bg-amber-50 border-amber-100 text-amber-950",
  "bg-rose-50 border-rose-100 text-rose-950",
];

// Demonstration only: illustrates empty slots and shared lectures across groups.
// Real records need semester, weekday, subgroup and recurrence/exception rules.
export function globalRow(
  year: number,
  groups: string[],
  day: number,
  slot: number,
): GlobalCell[] {
  const cells: GlobalCell[] = [];
  for (let index = 0; index < groups.length;) {
    let span = 1;
    const shared = slot === 1 || slot === 3;
    if (shared) {
      const prefix = groups[index].split("-")[0];
      while (
        index + span < groups.length &&
        groups[index + span].split("-")[0] === prefix
      )
        span++;
    }
    const subjectIndex = (index + day + year + slot) % 5;
    const empty = slot >= 5 || (!shared && (index + slot + day) % 3 === 0);
    cells.push({
      group: groups[index],
      span,
      subject: empty ? "" : courseSubjects[year][subjectIndex],
      type: shared ? "Лекция · поток" : slot % 2 ? "Практика" : "Лабораторная",
      classroom: `3-${201 + ((index + day + slot) % 12)}`,
      color: colors[subjectIndex],
    });
    index += span;
  }
  return cells;
}
