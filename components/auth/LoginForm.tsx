"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Check, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

type LoginFormProps = {
  onSwitch: () => void;
};

export default function LoginForm({ onSwitch }: LoginFormProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!loginData.email.trim()) {
      newErrors.email = "Введите email";
    }

    if (!loginData.password) {
      newErrors.password = "Введите пароль";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ password: "Неверный email или пароль" });
        return;
      }

      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      {/* Email */}
      <div>
        <label
          htmlFor="login-email"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Email
        </label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={loginData.email}
            onChange={(e) =>
              setLoginData({
                ...loginData,
                email: e.target.value,
              })
            }
            placeholder="student@utm.md"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {errors.email && (
          <p id="login-email-error" className="mt-2 text-sm text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="login-password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Пароль
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={loginData.password}
            onChange={(e) =>
              setLoginData({
                ...loginData,
                password: e.target.value,
              })
            }
            placeholder="Введите пароль"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "login-password-error" : undefined
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

        {errors.password && (
          <p id="login-password-error" className="mt-2 text-sm text-red-500">
            {errors.password}
          </p>
        )}
      </div>

      {/* Remember + forgot password */}
      <div className="flex items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={loginData.remember}
            onChange={(e) =>
              setLoginData({
                ...loginData,
                remember: e.target.checked,
              })
            }
            className="peer sr-only"
          />

          <span className="flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white transition peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100">
            {loginData.remember && (
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            )}
          </span>

          <span>Запомнить меня</span>
        </label>

        <button
          type="button"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          Забыли пароль?
        </button>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Входим..." : "Войти"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Нет аккаунта?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Зарегистрироваться
        </button>
      </p>
    </form>
  );
}
