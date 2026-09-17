import type { GradeSubject } from "@/lib/grades";

function isValidStage(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const stage = value as Record<string, unknown>;
  return (
    typeof stage.variable === "string" &&
    typeof stage.name === "string" &&
    typeof stage.grade === "string"
  );
}

export function isValidGradeSubjects(value: unknown): value is GradeSubject[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const subject = item as Record<string, unknown>;
    return (
      typeof subject.id === "string" &&
      typeof subject.name === "string" &&
      (subject.semester === 1 || subject.semester === 2) &&
      typeof subject.formula === "string" &&
      Array.isArray(subject.stages) &&
      subject.stages.every(isValidStage)
    );
  });
}

type GpaProfileResponse = { subjects: GradeSubject[] | null };

export async function fetchGpaProfile(): Promise<GradeSubject[] | null> {
  const response = await fetch("/api/gpa");

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    throw new Error("Не удалось загрузить сохранённые оценки.");
  }

  const data = (await response.json()) as GpaProfileResponse;
  return data.subjects;
}

export async function saveGpaProfile(subjects: GradeSubject[]): Promise<void> {
  const response = await fetch("/api/gpa", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subjects }),
  });

  if (!response.ok) {
    throw new Error("Не удалось сохранить оценки.");
  }
}
