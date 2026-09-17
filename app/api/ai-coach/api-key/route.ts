import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey } from "@/lib/byok";

const GEMINI_VALIDATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

async function validateGeminiKey(
  key: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    // The key travels in a header, not in the URL, so it never lands in access logs.
    const res = await fetch(GEMINI_VALIDATE_URL, {
      headers: { "x-goog-api-key": key },
    });
    if (res.ok) return { ok: true };

    let hint = "Проверьте ключ в Google AI Studio";
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) hint = body.error.message;
    } catch {}
    return { ok: false, message: `API ключ недействителен — ${hint}` };
  } catch {
    return {
      ok: false,
      message: "Не удалось проверить ключ — нет доступа к Gemini API",
    };
  }
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

    if (trimmedKey.length < 20) {
      return NextResponse.json(
        {
          message:
            "Ключ слишком короткий — Gemini ключи имеют длину 39+ символов",
        },
        { status: 422 },
      );
    }

    // Validate the key against the real Gemini API before saving
    const validation = await validateGeminiKey(trimmedKey);
    if (!validation.ok) {
      return NextResponse.json(
        { message: validation.message },
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
