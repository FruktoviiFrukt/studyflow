export const ALLOWED_GROUPS = ["TI-245", "TI-246"] as const;

export type Group = (typeof ALLOWED_GROUPS)[number];
