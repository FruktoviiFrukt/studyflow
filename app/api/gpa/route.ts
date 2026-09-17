import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidGradeSubjects } from "@/lib/gpa-profile";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const profile = await prisma.gpaProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ subjects: profile?.subjects ?? null });
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  let body: { subjects?: unknown };
  try {
    body = (await request.json()) as { subjects?: unknown };
  } catch {
    return NextResponse.json(
      { message: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { subjects } = body;

  if (!isValidGradeSubjects(subjects)) {
    return NextResponse.json(
      { message: "Некорректный формат данных об оценках" },
      { status: 400 },
    );
  }

  const profile = await prisma.gpaProfile.upsert({
    where: { userId: session.user.id },
    update: { subjects },
    create: { userId: session.user.id, subjects },
  });

  return NextResponse.json({ subjects: profile.subjects });
}
