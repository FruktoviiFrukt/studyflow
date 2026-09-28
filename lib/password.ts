const MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS_HINT =
  "Минимум 8 символов, включая заглавную и строчную буквы и цифру";

/**
 * The single source of truth for password strength — used on both register
 * and password-reset, client and server, so the rule never drifts between
 * call sites.
 */
export function passwordError(password: string): string | null {
  if (password.length < MIN_LENGTH) {
    return `Пароль должен содержать минимум ${MIN_LENGTH} символов`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Пароль должен содержать заглавную букву";
  }
  if (!/[a-z]/.test(password)) {
    return "Пароль должен содержать строчную букву";
  }
  if (!/[0-9]/.test(password)) {
    return "Пароль должен содержать цифру";
  }
  return null;
}

export function isPasswordValid(password: string): boolean {
  return passwordError(password) === null;
}
