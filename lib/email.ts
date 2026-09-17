/** Emails are compared case-insensitively; store and look them up in one form. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
