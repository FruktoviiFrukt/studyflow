import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createGlobalTemplateGet } from "@/lib/server/global-template-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createGlobalTemplateGet({
  authenticate: () => auth(),
  db: prisma,
});
