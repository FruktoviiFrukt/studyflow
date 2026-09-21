import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contentDisposition, readMaterialFile } from "@/lib/materials";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const download = new URL(request.url).searchParams.get("download") === "1";

  const record = await prisma.material.findUnique({ where: { id } });
  if (!record) {
    return jsonError("Материал не найден.", 404);
  }

  try {
    const bytes = await readMaterialFile(record.storageKey);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": record.mimeType,
        "Content-Length": String(record.size),
        "Content-Disposition": contentDisposition(
          download ? "attachment" : "inline",
          record.originalName,
        ),
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return jsonError("Файл не найден на диске.", 404);
    }
    throw error;
  }
}
