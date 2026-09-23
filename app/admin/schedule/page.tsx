import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ScheduleManager from "@/components/admin/schedule-manager";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/schedule");
  return <ScheduleManager />;
}
