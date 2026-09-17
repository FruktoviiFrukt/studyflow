import {
  adminRequest,
  importSchedule,
  listSchedules,
} from "@/lib/server/admin-schedule";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = (request: Request) => adminRequest(request, listSchedules);
export const POST = (request: Request) =>
  adminRequest(request, () => importSchedule(request));
