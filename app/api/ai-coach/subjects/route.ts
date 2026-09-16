import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { countTopicQuestions } from "@/lib/questions-file";

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
        select: { id: true, name: true },
      },
    },
  });

  // Count questions from centralized JSON files (data/topics/{topicId}.json)
  const result = subjects
    .map((s) => {
      let easy = 0,
        medium = 0,
        hard = 0;
      const topicsWithCounts = s.topics.map((t) => {
        const c = countTopicQuestions(t.id);
        easy += c.easy;
        medium += c.medium;
        hard += c.hard;
        return { id: t.id, name: t.name, questionCount: c.total };
      });

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        faculty: s.faculty,
        availableQuestions: easy + medium + hard,
        easyCount: easy,
        mediumCount: medium,
        hardCount: hard,
        topics: topicsWithCounts,
      };
    })
    // Hide subjects with no questions at all
    .filter((s) => s.availableQuestions > 0);

  return NextResponse.json(result);
}
