import { prisma } from "@/lib/prisma";
import { isValidGradeSubjects } from "@/lib/gpa-profile";
import type { GradeSubject } from "@/lib/grades";

export async function getStoredSubjects(
  userId: string,
): Promise<GradeSubject[] | null> {
  const profile = await prisma.gpaProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  return isValidGradeSubjects(profile.subjects) ? profile.subjects : null;
}
