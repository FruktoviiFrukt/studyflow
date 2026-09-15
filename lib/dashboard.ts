import { prisma } from "@/lib/prisma";

export async function getDashboardUser(userId: string) {
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
