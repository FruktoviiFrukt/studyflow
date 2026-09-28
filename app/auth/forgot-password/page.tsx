"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import AuthHero from "@/components/auth/AuthHero";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      setMessage(body.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthHero />

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <p className="text-2xl font-bold text-blue-700">StudyFlow</p>
            </div>

            <p className="text-sm font-medium text-blue-600">
              Восстановление доступа
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Забыли пароль?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Введите email, указанный при регистрации — мы отправим ссылку для
              сброса пароля.
            </p>

            {message ? (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {message}
              </div>
            ) : (
              <form
                className="mt-8 space-y-5"
                onSubmit={handleSubmit}
                noValidate
              >
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@utm.md"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Отправляем..." : "Отправить ссылку"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              <Link
                href="/auth"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Вернуться ко входу
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
