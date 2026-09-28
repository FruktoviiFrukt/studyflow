import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { passwordError } from "@/lib/password";

export async function POST(request: Request) {
  const body = await request.json();
  const { token, password } = body as { token?: unknown; password?: unknown };

  if (typeof token !== "string" || !token) {
    return NextResponse.json(
      { message: "Ссылка недействительна." },
      { status: 400 },
    );
  }

  if (typeof password !== "string") {
    return NextResponse.json({ message: "Введите пароль" }, { status: 400 });
  }

  const passwordIssue = passwordError(password);
  if (passwordIssue) {
    return NextResponse.json({ message: passwordIssue }, { status: 400 });
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.type !== "PASSWORD_RESET") {
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
      { message: "Срок действия ссылки истёк. Запросите новую ссылку." },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: "Пароль обновлён." });
}
