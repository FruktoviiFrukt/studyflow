"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ALLOWED_GROUPS } from "@/lib/groups";

type ProfileFormProps = {
  name: string;
  email: string;
  group: string | null;
};

const inputClassName =
  "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const readOnlyClassName =
  "flex h-10 w-full items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500";

export default function ProfileForm({ name, email, group }: ProfileFormProps) {
  const { update } = useSession();

  const [formName, setFormName] = useState(name);
  const [formGroup, setFormGroup] = useState(group ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    if (!formName.trim()) {
      setStatus({ type: "error", message: "Введите имя и фамилию" });
      return;
    }

    if (!formGroup) {
      setStatus({ type: "error", message: "Выберите группу" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, group: formGroup }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({
          type: "error",
          message: data.message ?? "Не удалось сохранить изменения",
        });
        return;
      }

      await update({ name: data.name, group: data.group });
      setStatus({ type: "success", message: "Изменения сохранены" });
    } catch {
      setStatus({
        type: "error",
        message: "Не удалось сохранить изменения",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6"
    >
      <div>
        <label
          htmlFor="profile-email"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Email
        </label>

        <div id="profile-email" className={readOnlyClassName}>
          {email}
        </div>
      </div>

      <div>
        <label
          htmlFor="profile-name"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Имя и фамилия
        </label>

        <input
          id="profile-name"
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="profile-group"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Группа
        </label>

        <Select value={formGroup} onValueChange={setFormGroup}>
          <SelectTrigger id="profile-group" className="w-full">
            <SelectValue placeholder="Выберите группу" />
          </SelectTrigger>

          <SelectContent>
            {ALLOWED_GROUPS.map((allowedGroup) => (
              <SelectItem key={allowedGroup} value={allowedGroup}>
                {allowedGroup}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {status && (
        <p
          className={
            status.type === "success"
              ? "text-sm text-green-600"
              : "text-sm text-red-500"
          }
        >
          {status.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="rounded-xl">
        {isSubmitting ? "Сохраняем..." : "Сохранить изменения"}
      </Button>
    </form>
  );
}
