"use client";

import { useState } from "react";

import AuthHero from "@/components/auth/AuthHero";
import AuthTabs from "@/components/auth/AuthTabs";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthHero />

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="mb-10 lg:hidden">
              <p className="text-2xl font-bold text-blue-700">StudyFlow</p>

              <p className="mt-1 text-sm text-slate-500">
                Политехнический Университет Молдовы
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-blue-600">
                Добро пожаловать
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                {mode === "login" ? "Войдите в аккаунт" : "Создайте аккаунт"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {mode === "login"
                  ? "Введите данные вашего аккаунта StudyFlow."
                  : "Зарегистрируйтесь, чтобы начать пользоваться StudyFlow."}
              </p>
            </div>

            <AuthTabs mode={mode} onChange={setMode} />

            {mode === "login" ? (
              <LoginForm onSwitch={() => setMode("register")} />
            ) : (
              <RegisterForm onSwitch={() => setMode("login")} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
