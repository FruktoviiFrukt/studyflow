import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDashboardUser } from "@/lib/dashboard";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { message: "Необходима авторизация" },
      { status: 401 },
    );
  }

  const user = await getDashboardUser(userId);

  if (!user) {
    return NextResponse.json(
      { message: "Пользователь не найден" },
      { status: 404 },
    );
  }

  return NextResponse.json({ user });
}
