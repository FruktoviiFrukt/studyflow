import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey } from "@/lib/byok";

function isPlausibleGeminiKey(key: string): boolean {
  return key.length >= 20;
}

// GET /api/ai-coach/api-key — check whether the current user has a key linked
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Не авторизовано" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { geminiApiKey: true },
  });

  return NextResponse.json({ linked: Boolean(user?.geminiApiKey) });
}

// POST /api/ai-coach/api-key — link or replace Gemini API key
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизовано" }, { status: 401 });
    }

    let body: { apiKey?: unknown };
    try {
      body = (await request.json()) as { apiKey?: unknown };
    } catch {
      return NextResponse.json(
        { message: "Неверный формат запроса" },
        { status: 400 },
      );
    }

    const { apiKey } = body;

    if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
      return NextResponse.json(
        { message: "API-ключ не может быть пустым" },
        { status: 400 },
      );
    }

    const trimmedKey = apiKey.trim();

    if (!isPlausibleGeminiKey(trimmedKey)) {
      return NextResponse.json(
        { message: "Ключ слишком короткий" },
        { status: 422 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { geminiApiKey: encryptApiKey(trimmedKey) },
    });

    return NextResponse.json({ linked: true });
  } catch (err) {
    console.error("[api-key POST]", err);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}

// DELETE /api/ai-coach/api-key — unlink Gemini API key
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Не авторизовано" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { geminiApiKey: null },
  });

  return NextResponse.json({ linked: false });
}
