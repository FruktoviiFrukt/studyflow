import { prisma } from "@/lib/prisma";
import type { DashboardUser } from "@/types/dashboard";

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
