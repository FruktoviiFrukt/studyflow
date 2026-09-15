import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDashboardUser } from "@/lib/dashboard";
import type {
  DashboardErrorResponse,
  DashboardResponse,
} from "@/types/dashboard";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    const response: DashboardErrorResponse = {
      message: "Необходима авторизация",
    };

    return NextResponse.json(response, { status: 401 });
  }

  const user = await getDashboardUser(userId);

  if (!user) {
    const response: DashboardErrorResponse = {
      message: "Пользователь не найден",
    };

    return NextResponse.json(response, { status: 404 });
  }

  const response: DashboardResponse = {
    user,
  };

  return NextResponse.json(response);
}
