export type CatalogSubject = {
  id: string;
  name: string;
  code: string | null;
  faculty: string | null;
  ectsCredits: number | null;
  status: "ACTIVE" | "ARCHIVED";
  schedules: { total: number; published: number; drafts: number };
};

export type SubjectSchedule = {
  id: string;
  title: string;
  kind: "STUDENT" | "GLOBAL" | "ASSESSMENT";
  status: "DRAFT" | "PUBLISHED";
  academicYear: string;
  semester: number;
  course: number;
  validFrom: string;
  validTo: string;
  lessonCount: number;
  groups: string[];
  teachers: string[];
};

export type CatalogSubjectDetails = CatalogSubject & {
  relatedSchedules: SubjectSchedule[];
};

export const SUBJECT_LIMITS = { name: 160, code: 40, faculty: 80 } as const;

export function isValidEctsCredits(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 60 &&
    Math.abs(value * 10 - Math.round(value * 10)) < 1e-8
  );
}
