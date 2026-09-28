import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSubjectCatalogApi } from "@/lib/server/subject-catalog-api";

const api = createSubjectCatalogApi({ authenticate: auth, db: prisma });
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api.DELETE(request, (await params).id);
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api.DETAIL(request, (await params).id);
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return api.PATCH(request, (await params).id);
}
