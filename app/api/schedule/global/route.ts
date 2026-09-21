import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createGlobalScheduleGet } from "@/lib/server/global-schedule-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createGlobalScheduleGet({
  authenticate: () => auth(),
  db: prisma,
});
