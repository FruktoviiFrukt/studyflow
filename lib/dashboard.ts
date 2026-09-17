import { subjectGrade } from "@/lib/grades";
import { prisma } from "@/lib/prisma";
import { getStoredSubjects } from "@/lib/server/gpa-profile";
import type { DashboardResponse, DashboardUser } from "@/types/dashboard";

export async function getDashboardUser(
  userId: string,
): Promise<DashboardUser | null> {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
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

  const subjects = await getStoredSubjects(userId);

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
  };
}
