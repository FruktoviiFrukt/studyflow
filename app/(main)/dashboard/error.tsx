"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle size={24} />
        </div>

        <h2 className="mt-5 text-xl font-semibold text-gray-900">
          Не удалось загрузить Dashboard
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Проверьте подключение и попробуйте загрузить страницу ещё раз.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
