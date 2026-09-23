import { subjectGrade } from "@/lib/grades";
import { prisma } from "@/lib/prisma";
import { addDays, universityToday } from "@/lib/schedule";
import { getStoredSubjects } from "@/lib/server/gpa-profile";
import type { DashboardResponse, DashboardUser } from "@/types/dashboard";

export async function getDashboardUser(
  userId: string,
): Promise<DashboardUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      group: true,
    },
  });
}

export async function getDashboardData(
  userId: string,
): Promise<DashboardResponse | null> {
  const user = await getDashboardUser(userId);

  if (!user) {
    return null;
  }

  const today = universityToday();
  const weekEnd = addDays(today, 7);

  const [upcomingCount, completedCount, deadlines, subjects, materialsCount] =
    await Promise.all([
      prisma.task.count({
        where: {
          userId,
          status: { not: "done" },
          dueDate: { gte: today, lte: weekEnd },
        },
      }),
      prisma.task.count({
        where: { userId, status: "done" },
      }),
      prisma.task.findMany({
        where: {
          userId,
          status: { not: "done" },
          dueDate: { gte: today },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        take: 3,
        select: {
          id: true,
          subject: true,
          title: true,
          dueDate: true,
        },
      }),
      getStoredSubjects(userId),
      prisma.material.count(),
    ]);

  const subjectProgress = (subjects ?? []).map((subject) => {
    const grade = subjectGrade(subject);

    return {
      id: subject.id,
      name: subject.name,
      semester: subject.semester,
      grade,
      progress: grade === null ? 0 : Math.round(grade * 10),
    };
  });

  return {
    user,
    subjectProgress,
    materialsCount,
    tasks: {
      upcomingCount,
      completedCount,
      deadlines,
    },
  };
}
