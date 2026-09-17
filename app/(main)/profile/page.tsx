import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import ProfileForm from "@/components/profile/ProfileForm";
import { getNextLesson } from "@/lib/schedule";
import { calculateOverall, gradeStatus, initialSubjects } from "@/lib/grades";
import { getStoredSubjects } from "@/lib/server/gpa-profile";
import { INITIAL_TASKS } from "@/lib/tasks";

export const metadata: Metadata = { title: "Профиль | StudyHub" };

const formatGrade = (value: number | null) =>
  value === null
    ? "—"
    : value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth");
  }

  const nextLesson = getNextLesson();
  const storedSubjects = await getStoredSubjects(session.user.id);
  const subjects = storedSubjects ?? initialSubjects;
  const overall = calculateOverall(subjects);
  const upcomingTasks = INITIAL_TASKS.filter((task) => task.status !== "done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-2xl">
      <section className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Аккаунт
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Профиль
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Основная информация об аккаунте.
        </p>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Ближайшее занятие
          </p>

          {nextLesson ? (
            <div className="mt-2">
              <p className="text-sm font-semibold text-gray-900">
                {nextLesson.subject}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {nextLesson.day}, {nextLesson.start}–{nextLesson.end}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Ауд. {nextLesson.classroom}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Занятий не запланировано.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Средний балл
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {formatGrade(overall.average)}
            <span className="ml-1 text-sm font-medium text-gray-400">/ 10</span>
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {gradeStatus(overall.average)} · учтено {overall.countedSubjects} из{" "}
            {subjects.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Ближайшие дедлайны
          </p>

          {upcomingTasks.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="text-sm">
                  <p className="truncate font-medium text-gray-900">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500">{task.dueDate}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Нет незавершённых заданий.
            </p>
          )}
        </div>
      </section>

      <ProfileForm
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        group={session.user.group}
      />
    </div>
  );
}
