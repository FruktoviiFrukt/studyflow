import { adminRequest, sourcePdf } from "@/lib/server/admin-schedule";
export const runtime = "nodejs";
export const GET = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => adminRequest(request, async () => sourcePdf((await context.params).id));
