import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN") return null;
  return session.user;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await params;
  let body: {
    name?: unknown;
    code?: unknown;
    faculty?: unknown;
    active?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { message: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim())
    data.name = body.name.trim();
  if (typeof body.code === "string" && body.code.trim())
    data.code = body.code.trim().toUpperCase();
  if (typeof body.faculty === "string" && body.faculty.trim())
    data.faculty = body.faculty.trim().toUpperCase();
  if (typeof body.active === "boolean") data.active = body.active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { message: "Нет данных для обновления" },
      { status: 400 },
    );
  }

  try {
    const subject = await prisma.facultySubject.update({
      where: { id },
      data,
      include: { _count: { select: { topics: true } } },
    });
    return NextResponse.json(subject);
  } catch {
    return NextResponse.json({ message: "Предмет не найден" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.facultySubject.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Предмет не найден" }, { status: 404 });
  }
}
