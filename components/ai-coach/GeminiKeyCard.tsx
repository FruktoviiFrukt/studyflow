"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onLinked?: () => void;
  onUnlinked?: () => void;
};

type Status = { type: "success" | "error"; message: string } | null;

export default function GeminiKeyCard({ onLinked, onUnlinked }: Props) {
  const [linked, setLinked] = useState<boolean | null>(null);
  const [keyValue, setKeyValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/ai-coach/api-key")
      .then((r) => r.json())
      .then((data: { linked: boolean }) => setLinked(data.linked))
      .catch(() => setLinked(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!keyValue.trim()) {
      setStatus({ type: "error", message: "Введите API-ключ" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ai-coach/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyValue.trim() }),
      });
      if (!res.ok) {
        let message = "Не удалось привязать ключ";
        try {
          const data = (await res.json()) as { message?: string };
          if (data.message) message = data.message;
        } catch {}
        setStatus({ type: "error", message });
        return;
      }
      setLinked(true);
      setKeyValue("");
      setStatus({ type: "success", message: "Ключ успешно привязан" });
      onLinked?.();
    } catch {
      setStatus({
        type: "error",
        message: "Не удалось подключиться к серверу",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setStatus(null);
    setDeleting(true);
    try {
      await fetch("/api/ai-coach/api-key", { method: "DELETE" });
      setLinked(false);
      setStatus(null);
      onUnlinked?.();
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      setStatus({ type: "error", message: "Ошибка сети" });
    } finally {
      setDeleting(false);
    }
  }

  const inputCls =
    "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-900 font-mono outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <KeyRound aria-hidden="true" className="size-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">
          Gemini API-ключ
        </h3>
      </div>

      <p className="text-sm text-gray-500">
        AI Exam Coach использует ваш личный ключ Google Gemini. Он хранится в
        зашифрованном виде и никогда не передаётся третьим лицам.{" "}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline-offset-2 hover:underline"
        >
          Получить ключ бесплатно →
        </a>
      </p>

      {linked === null && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Загрузка…
        </div>
      )}

      {linked === true && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2
              aria-hidden="true"
              className="size-4 shrink-0 text-emerald-600"
            />
            <span className="text-sm font-medium text-emerald-800">
              Ключ привязан
            </span>
            <span className="font-mono text-sm tracking-widest text-emerald-700">
              ●●●●●●●●●●●●●●●●
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Удалить ключ"
            disabled={deleting}
            onClick={handleDelete}
            className="shrink-0 text-gray-400 hover:text-rose-600"
          >
            {deleting ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="size-4" />
            )}
          </Button>
        </div>
      )}

      {linked === false && (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label
              htmlFor="gemini-api-key"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              API-ключ
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="gemini-api-key"
                type={showKey ? "text" : "password"}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="Вставьте ключ из Google AI Studio…"
                autoComplete="off"
                spellCheck={false}
                className={inputCls}
              />
              <button
                type="button"
                aria-label={showKey ? "Скрыть ключ" : "Показать ключ"}
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </div>

          {status && (
            <p
              className={cn(
                "text-sm",
                status.type === "success"
                  ? "text-emerald-600"
                  : "text-rose-600",
              )}
            >
              {status.message}
            </p>
          )}

          <Button type="submit" disabled={saving} className="rounded-xl">
            {saving ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" />
                Проверяем ключ…
              </>
            ) : (
              "Привязать ключ"
            )}
          </Button>
        </form>
      )}

      {linked === true && status?.type === "success" && (
        <p className="text-sm text-emerald-600">{status.message}</p>
      )}
    </div>
  );
}
