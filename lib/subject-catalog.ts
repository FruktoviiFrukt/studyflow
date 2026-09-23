export type CatalogSubject = {
  id: string;
  name: string;
  code: string | null;
  faculty: string | null;
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
