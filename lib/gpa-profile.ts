import type { GradeSubject } from "@/lib/grades";

// Limits protect the JSONB column from unbounded payloads; the UI never comes
// close to them, so hitting one means the request was not produced by the app.
export const GPA_LIMITS = {
  subjects: 100,
  stages: 30,
  text: 200,
  formula: 500,
} as const;

function isBoundedString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length <= max;
}

function isValidStage(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const stage = value as Record<string, unknown>;
  return (
    isBoundedString(stage.variable, GPA_LIMITS.text) &&
    isBoundedString(stage.name, GPA_LIMITS.text) &&
    isBoundedString(stage.grade, GPA_LIMITS.text)
  );
}

export function isValidGradeSubjects(value: unknown): value is GradeSubject[] {
  if (!Array.isArray(value) || value.length > GPA_LIMITS.subjects) return false;
  const ids = new Set<string>();
  return value.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const subject = item as Record<string, unknown>;
    if (!isBoundedString(subject.id, GPA_LIMITS.text) || ids.has(subject.id)) {
      return false;
    }
    ids.add(subject.id);
    return (
      isBoundedString(subject.name, GPA_LIMITS.text) &&
      (subject.semester === 1 || subject.semester === 2) &&
      isBoundedString(subject.formula, GPA_LIMITS.formula) &&
      Array.isArray(subject.stages) &&
      subject.stages.length <= GPA_LIMITS.stages &&
      subject.stages.every(isValidStage)
    );
  });
}

type GpaProfileResponse = { subjects: GradeSubject[] | null };

/** Returns the saved subjects, or null when the user has no profile yet. */
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
