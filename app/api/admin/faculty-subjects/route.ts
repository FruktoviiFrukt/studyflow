import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN") return null;
  return session.user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const subjects = await prisma.facultySubject.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { topics: true } },
    },
  });

  return NextResponse.json(subjects);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  let body: { name?: unknown; code?: unknown; faculty?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { message: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { name, code, faculty } = body;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { message: "Укажите название предмета" },
      { status: 400 },
    );
  }
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json(
      { message: "Укажите код предмета" },
      { status: 400 },
    );
  }
  if (typeof faculty !== "string" || !faculty.trim()) {
    return NextResponse.json({ message: "Укажите факультет" }, { status: 400 });
  }

  const existing = await prisma.facultySubject.findFirst({
    where: { OR: [{ name: name.trim() }, { code: code.trim().toUpperCase() }] },
  });
  if (existing) {
    return NextResponse.json(
      { message: "Предмет с таким названием или кодом уже существует" },
      { status: 409 },
    );
  }

  const subject = await prisma.facultySubject.create({
    data: {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      faculty: faculty.trim().toUpperCase(),
    },
    include: { _count: { select: { topics: true } } },
  });

  return NextResponse.json(subject, { status: 201 });
}
