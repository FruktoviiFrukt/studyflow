import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAssessmentScheduleGet } from "@/lib/server/assessment-schedule-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createAssessmentScheduleGet({
  authenticate: () => auth(),
  db: prisma,
});
