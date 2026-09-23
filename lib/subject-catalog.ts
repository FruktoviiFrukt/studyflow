export type CatalogSubject = {
  id: string;
  name: string;
  code: string | null;
  faculty: string | null;
  status: "ACTIVE" | "ARCHIVED";
};

export const SUBJECT_LIMITS = { name: 160, code: 40, faculty: 80 } as const;
