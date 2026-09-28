import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { token } = body as { token?: unknown };

  if (typeof token !== "string" || !token) {
    return NextResponse.json(
      { message: "Ссылка недействительна." },
      { status: 400 },
    );
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.type !== "EMAIL_VERIFY") {
    return NextResponse.json(
      { message: "Ссылка недействительна." },
      { status: 400 },
    );
  }

  if (record.usedAt) {
    return NextResponse.json(
      { message: "Эта ссылка уже была использована." },
      { status: 400 },
    );
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.json(
      {
        message:
          "Срок действия ссылки истёк. Зарегистрируйтесь ещё раз или запросите новую ссылку.",
      },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: "Email подтверждён." });
}
