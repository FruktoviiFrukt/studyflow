import { adminRequest, changeSchedule } from "@/lib/server/admin-schedule";
export const runtime = "nodejs";
export const PATCH = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) =>
  adminRequest(request, async () =>
    changeSchedule(request, (await context.params).id),
  );
