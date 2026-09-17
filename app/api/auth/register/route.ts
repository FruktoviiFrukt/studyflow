import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { ALLOWED_GROUPS } from "@/lib/groups";
import { normalizeEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

export async function POST(request: Request) {
  let body: {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    group?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { message: "Неверный формат запроса" },
      { status: 400 },
    );
  }
  const { name, password, group } = body;
  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : body.email;

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

  if (
    typeof password !== "string" ||
    password.length < PASSWORD_MIN ||
    password.length > PASSWORD_MAX
  ) {
    return NextResponse.json(
      {
        message: `Пароль должен содержать от ${PASSWORD_MIN} до ${PASSWORD_MAX} символов`,
      },
      { status: 400 },
    );
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

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        group,
        groupId: studyGroup.id,
      },
    });
  } catch (error) {
    // Two registrations with the same email can pass the check above at once;
    // the unique index is the source of truth.
    if ((error as { code?: unknown }).code === "P2002") {
      return NextResponse.json(
        { message: "Этот email уже зарегистрирован" },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name },
    { status: 201 },
  );
}
