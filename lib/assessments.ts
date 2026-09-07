import { addDays, type Lesson } from "./schedule";

export const assessmentKinds = ["Аттестация 1", "Аттестация 2", "Переаттестация", "Экзамен"] as const;
export type AssessmentKind = typeof assessmentKinds[number];
// Recurring demo fixtures for UI review; replace with dated assessment API records.
export function getDemoAssessments(week: string, kind: AssessmentKind): Lesson[] {
  const subjects: Lesson["subject"][] = ["programming", "math", "databases", "networks", "english"];
  const index = assessmentKinds.indexOf(kind);
  return subjects.slice(0, kind === "Переаттестация" ? 2 : 5).map((subject, day) => ({
    id: `${kind}-${week}-${day}`, date: addDays(week, (day + index) % 5),
    slot: (day + index) % 3, subject, type: kind,
    classroom: `3-${201 + day}`, teacher: ["Ион Попеску", "Елена Русу", "Андрей Чобану", "Виктор Мунтяну", "Мария Кожокару"][day],
    topic: kind === "Экзамен" ? "Итоговая проверка знаний за семестр" : kind === "Переаттестация" ? "Повторная проверка пройденного материала" : `Проверка знаний · ${kind.toLowerCase()}`,
  }));
}
