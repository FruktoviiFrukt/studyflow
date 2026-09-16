import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Не авторизовано" }, { status: 401 });
  }

  const subjects = await prisma.facultySubject.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      faculty: true,
      topics: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          _count: { select: { questions: true } },
        },
      },
      _count: { select: { topics: true } },
    },
  });

  const result = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    faculty: s.faculty,
    availableQuestions: s.topics.reduce(
      (sum, t) => sum + t._count.questions,
      0,
    ),
    topics: s.topics.map((t) => ({
      id: t.id,
      name: t.name,
      questionCount: t._count.questions,
    })),
  }));

  return NextResponse.json(result);
}
