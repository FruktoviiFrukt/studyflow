"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type VerifyEmailStatusProps = {
  token: string | undefined;
};

type Status = "loading" | "success" | "error";

export default function VerifyEmailStatus({ token }: VerifyEmailStatusProps) {
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token ? "" : "Ссылка недействительна.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (cancelled) return;
        const body = await response.json();
        setStatus(response.ok ? "success" : "error");
        setMessage(body.message);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setMessage("Не удалось подтвердить email. Попробуйте ещё раз позже.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="text-center">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Подтверждаем email...
          </h2>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Email подтверждён
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Теперь вы можете войти в свой аккаунт StudyFlow.
          </p>
          <Link
            href="/auth"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Войти
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Не удалось подтвердить email
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
          <Link
            href="/auth"
            className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Вернуться ко входу
          </Link>
        </>
      )}
    </div>
  );
}
