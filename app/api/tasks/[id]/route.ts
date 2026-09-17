import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES } from "@/lib/tasks";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedTask(userId: string, id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return null;
  if (task.userId !== userId) return null;
  return task;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const task = await getOwnedTask(session.user.id, id);
  if (!task)
    return NextResponse.json(
      { message: "Задание не найдено" },
      { status: 404 },
    );

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { message: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  // Build partial update — only validate fields that are present
  const data: Record<string, unknown> = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title.trim())
      return NextResponse.json(
        { message: "Введите название задания." },
        { status: 400 },
      );
    if (body.title.trim().length > 160)
      return NextResponse.json(
        { message: "Название должно быть не длиннее 160 символов." },
        { status: 400 },
      );
    data.title = body.title.trim();
  }

  if ("subject" in body) {
    if (typeof body.subject !== "string" || !body.subject.trim())
      return NextResponse.json(
        { message: "Укажите предмет." },
        { status: 400 },
      );
    data.subject = body.subject.trim();
  }

  if ("type" in body) {
    if (typeof body.type !== "string" || !TASK_TYPES.includes(body.type))
      return NextResponse.json(
        { message: "Укажите тип задания." },
        { status: 400 },
      );
    data.type = body.type;
  }

  if ("priority" in body) {
    if (
      typeof body.priority !== "string" ||
      !TASK_PRIORITIES.some((p) => p.value === body.priority)
    )
      return NextResponse.json(
        { message: "Укажите приоритет." },
        { status: 400 },
      );
    data.priority = body.priority;
  }

  if ("status" in body) {
    if (
      typeof body.status !== "string" ||
      !TASK_STATUSES.some((s) => s.value === body.status)
    )
      return NextResponse.json({ message: "Укажите статус." }, { status: 400 });
    data.status = body.status;
  }

  if ("dueDate" in body) {
    if (
      typeof body.dueDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)
    )
      return NextResponse.json(
        { message: "Укажите корректную дату дедлайна." },
        { status: 400 },
      );
    const d = new Date(`${body.dueDate}T12:00:00`);
    const [y, m, day] = body.dueDate.split("-").map(Number);
    if (
      !Number.isFinite(d.getTime()) ||
      d.getFullYear() !== y ||
      d.getMonth() + 1 !== m ||
      d.getDate() !== day
    )
      return NextResponse.json(
        { message: "Укажите корректную дату дедлайна." },
        { status: 400 },
      );
    data.dueDate = body.dueDate;
  }

  if ("notes" in body) {
    if (body.notes !== null && body.notes !== undefined) {
      if (typeof body.notes !== "string" || body.notes.length > 2000)
        return NextResponse.json(
          { message: "Описание должно быть не длиннее 2000 символов." },
          { status: 400 },
        );
    }
    data.notes = body.notes ?? null;
  }

  const updated = await prisma.task.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const task = await getOwnedTask(session.user.id, id);
  if (!task)
    return NextResponse.json(
      { message: "Задание не найдено" },
      { status: 404 },
    );

  await prisma.task.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
