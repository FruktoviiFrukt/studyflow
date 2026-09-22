import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createScheduleGet } from "@/lib/server/schedule-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createScheduleGet({
  authenticate: () => auth(),
  db: prisma,
});
