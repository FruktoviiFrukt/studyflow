"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";

type RegisterFormProps = {
  onSwitch: () => void;
};

export default function RegisterForm({ onSwitch }: RegisterFormProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!registerData.name.trim()) {
      newErrors.name = "Введите имя и фамилию";
    }

    if (!registerData.email.trim()) {
      newErrors.email = "Введите email";
    }

    if (registerData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
    }

    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = "Повторите пароль";
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      if (response.status === 409) {
        setErrors({ email: "Этот email уже зарегистрирован" });
        return;
      }

      if (!response.ok) {
        setErrors({
          email: "Не удалось зарегистрироваться, попробуйте ещё раз",
        });
        return;
      }

      const result = await signIn("credentials", {
        email: registerData.email,
        password: registerData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({
          email:
            "Аккаунт создан, но не удалось войти. Попробуйте войти вручную",
        });
        return;
      }

      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      {/* Name */}
      <div>
        <label
          htmlFor="register-name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Имя и фамилия
        </label>

        <div className="relative">
          <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={registerData.name}
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                name: e.target.value,
              })
            }
            placeholder="Ana Popescu"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {errors.name && (
          <p id="register-name-error" className="mt-2 text-sm text-red-500">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="register-email"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Email
        </label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={registerData.email}
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                email: e.target.value,
              })
            }
            placeholder="student@utm.md"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {errors.email && (
          <p id="register-email-error" className="mt-2 text-sm text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="register-password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Пароль
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={registerData.password}
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                password: e.target.value,
              })
            }
            placeholder="Минимум 6 символов"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "register-password-error" : undefined
            }
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

        {errors.password && (
          <p id="register-password-error" className="mt-2 text-sm text-red-500">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label
          htmlFor="register-confirm-password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Повторите пароль
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={registerData.confirmPassword}
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                confirmPassword: e.target.value,
              })
            }
            placeholder="Повторите пароль"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword
                ? "register-confirm-password-error"
                : undefined
            }
            className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
            aria-label={
              showConfirmPassword ? "Скрыть пароль" : "Показать пароль"
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {errors.confirmPassword && (
          <p
            id="register-confirm-password-error"
            className="mt-2 text-sm text-red-500"
          >
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Создаём аккаунт..." : "Создать аккаунт"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Уже есть аккаунт?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Войти
        </button>
      </p>
    </form>
  );
}
