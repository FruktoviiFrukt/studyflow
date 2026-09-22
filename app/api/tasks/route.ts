import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES } from "@/lib/tasks";

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  todo: 1,
  done: 2,
};

function validateBody(body: Record<string, unknown>) {
  const { title, subject, type, priority, status, dueDate, notes } = body;

  if (typeof title !== "string" || !title.trim())
    return "Введите название задания.";
  if (title.trim().length > 160)
    return "Название должно быть не длиннее 160 символов.";
  if (typeof subject !== "string" || !subject.trim()) return "Укажите предмет.";
  if (typeof type !== "string" || !TASK_TYPES.includes(type))
    return "Укажите тип задания.";
  if (
    typeof priority !== "string" ||
    !TASK_PRIORITIES.some((p) => p.value === priority)
  )
    return "Укажите приоритет.";
  if (
    typeof status !== "string" ||
    !TASK_STATUSES.some((s) => s.value === status)
  )
    return "Укажите статус.";
  if (typeof dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return "Укажите корректную дату дедлайна.";
  }
  const d = new Date(`${dueDate}T12:00:00`);
  const [y, m, day] = dueDate.split("-").map(Number);
  if (
    !Number.isFinite(d.getTime()) ||
    d.getFullYear() !== y ||
    d.getMonth() + 1 !== m ||
    d.getDate() !== day
  )
    return "Укажите корректную дату дедлайна.";
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== "string" || notes.length > 2000)
      return "Описание должно быть не длиннее 2000 символов.";
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ createdAt: "desc" }],
  });

  const sorted = tasks.sort((a, b) => {
    const statusDiff =
      (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { message: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const error = validateBody(body);
  if (error) return NextResponse.json({ message: error }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      userId: session.user.id,
      title: (body.title as string).trim(),
      subject: (body.subject as string).trim(),
      type: body.type as string,
      priority: body.priority as string,
      status: body.status as string,
      dueDate: body.dueDate as string,
      notes: body.notes ? (body.notes as string) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
