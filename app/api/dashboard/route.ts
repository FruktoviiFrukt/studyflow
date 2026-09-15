import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { message: "Необходима авторизация" },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      group: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Пользователь не найден" },
      { status: 404 },
    );
  }

  return NextResponse.json({ user });
}
