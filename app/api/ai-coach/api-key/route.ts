import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey } from "@/lib/byok";

const GEMINI_VALIDATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${GEMINI_VALIDATE_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with the word OK." }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });
    // 400 = bad request (key format wrong), 403 = key invalid/no permissions
    // 200 or 429 (rate-limited but key exists) = key is valid
    return res.status === 200 || res.status === 429;
  } catch {
    return false;
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

  const isValid = await validateGeminiKey(trimmedKey);
  if (!isValid) {
    return NextResponse.json(
      { message: "Ключ недействителен или не имеет доступа к Gemini API" },
      { status: 422 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { geminiApiKey: encryptApiKey(trimmedKey) },
  });

  return NextResponse.json({ linked: true });
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
