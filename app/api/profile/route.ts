import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_GROUPS } from "@/lib/groups";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Не авторизовано" }, { status: 401 });
  }

  const body = await request.json();
  const { name, group } = body as {
    name?: unknown;
    group?: unknown;
  };

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { message: "Введите имя и фамилию" },
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

  const user = await prisma.$transaction(async (tx) => {
    const studyGroup = await tx.studyGroup.upsert({
      where: { name: group },
      update: {},
      create: { name: group },
    });
    return tx.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        group,
        groupId: studyGroup.id,
        subgroupId: null,
      },
    });
  });

  return NextResponse.json({ name: user.name, group: user.group });
}
