import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  deleteMaterialFile,
  extensionFromFileName,
  isAllowedSubject,
  materialTypeFromFileName,
  MAX_MATERIAL_BYTES,
  mimeTypeFor,
  saveMaterialFile,
  toMaterialDto,
  validateTitle,
} from "@/lib/materials";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET() {
  const records = await prisma.material.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({
    materials: records.map(toMaterialDto),
  });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Не удалось прочитать форму загрузки.", 400);
  }

  const title = String(formData.get("title") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const file = formData.get("file");

  const titleError = validateTitle(title);
  if (titleError) return jsonError(titleError, 400);

  if (!isAllowedSubject(subject)) {
    return jsonError("Выберите предмет.", 400);
  }

  if (!(file instanceof File)) {
    return jsonError("Прикрепите файл.", 400);
  }

  if (file.size <= 0) {
    return jsonError("Файл пустой.", 400);
  }

  if (file.size > MAX_MATERIAL_BYTES) {
    return jsonError("Файл слишком большой. Максимум — 50 МБ.", 400);
  }

  const type = materialTypeFromFileName(file.name);
  if (!type) {
    return jsonError(
      "Неподдерживаемый тип файла. Разрешены PDF, DOCX, PPTX, XLSX, PNG, JPG и TXT.",
      400,
    );
  }

  const ext = extensionFromFileName(file.name);
  if (!ext) {
    return jsonError("У файла должно быть расширение.", 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentHash = createHash("sha256").update(bytes).digest("hex");

  const duplicate = await prisma.material.findUnique({
    where: { contentHash },
  });
  if (duplicate) {
    return jsonError("Такой файл уже загружен.", 409);
  }

  const id = crypto.randomUUID();
  const storageKey = `${id}${ext}`;

  await saveMaterialFile(storageKey, bytes);

  try {
    const record = await prisma.material.create({
      data: {
        id,
        title: title.trim(),
        subject,
        type,
        size: file.size,
        originalName: file.name,
        storageKey,
        mimeType: mimeTypeFor(type, file.type),
        contentHash,
      },
    });

    return NextResponse.json(
      { material: toMaterialDto(record) },
      { status: 201 },
    );
  } catch (error) {
    await deleteMaterialFile(storageKey);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return jsonError("Такой файл уже загружен.", 409);
    }
    throw error;
  }
}
