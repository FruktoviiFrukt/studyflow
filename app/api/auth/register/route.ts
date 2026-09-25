import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { ALLOWED_GROUPS } from "@/lib/groups";
import { passwordError } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/server/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password, group } = body as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    group?: unknown;
  };

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { message: "Введите имя и фамилию" },
      { status: 400 },
    );
  }

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { message: "Введите корректный email" },
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

  if (
    typeof group !== "string" ||
    !ALLOWED_GROUPS.includes(group as (typeof ALLOWED_GROUPS)[number])
  ) {
    return NextResponse.json(
      { message: "Выберите группу из списка" },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "Этот email уже зарегистрирован" },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const studyGroup = await prisma.studyGroup.upsert({
    where: { name: group },
    update: {},
    create: { name: group },
  });

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      password: hashedPassword,
      group,
      groupId: studyGroup.id,
    },
  });

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      token,
      userId: user.id,
      type: "EMAIL_VERIFY",
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });
  await sendVerificationEmail(user.email, token);

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name },
    { status: 201 },
  );
}
