import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteMaterialFile } from "@/lib/materials";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const record = await prisma.material.findUnique({ where: { id } });
  if (!record) {
    return jsonError("Материал не найден.", 404);
  }

  await prisma.material.delete({ where: { id } });
  await deleteMaterialFile(record.storageKey);

  return NextResponse.json({ ok: true });
}
