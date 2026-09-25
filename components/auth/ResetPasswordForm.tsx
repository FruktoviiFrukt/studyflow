"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, CheckCircle2, XCircle } from "lucide-react";

import { passwordError, PASSWORD_REQUIREMENTS_HINT } from "@/lib/password";

type ResetPasswordFormProps = {
  token: string | undefined;
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold text-slate-900">
          Ссылка недействительна
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Запросите новую ссылку для сброса пароля.
        </p>
        <Link
          href="/auth/forgot-password"
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Забыли пароль?
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h2 className="mt-4 text-xl font-semibold text-slate-900">
          Пароль обновлён
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Теперь вы можете войти с новым паролем.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Войти
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const issue = passwordError(password);
    if (issue) {
      setError(issue);
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.message);
        return;
      }
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <p className="text-sm font-medium text-blue-600">
        Восстановление доступа
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        Новый пароль
      </h2>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="reset-password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Новый пароль
          </label>

          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={PASSWORD_REQUIREMENTS_HINT}
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="reset-confirm-password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Повторите пароль
          </label>

          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              id="reset-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Сохраняем..." : "Сохранить новый пароль"}
        </button>
      </form>
    </>
  );
}
