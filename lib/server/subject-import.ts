import type { Prisma } from "@/lib/generated/prisma/client";
import { subjectNameKey, type SubjectChoice } from "@/lib/subject-matching";

// Caller holds the schedule mutation lock and runs this inside its transaction.
export async function resolveImportSubjects(
  tx: Prisma.TransactionClient,
  choices: SubjectChoice[],
) {
  const catalog = await tx.subject.findMany({
    select: { id: true, name: true },
  });
  const resolved = new Map<string, { id: string; name: string }>();
  for (const choice of choices) {
    let subject: { id: string; name: string } | undefined;
    if (choice.subjectId !== null) {
      subject = catalog.find((s) => s.id === choice.subjectId);
      if (!subject)
        throw new RangeError(
          `Дисциплина для «${choice.sourceName}» больше не существует. Повторите сопоставление.`,
        );
    } else {
      const matches = catalog.filter(
        (s) => subjectNameKey(s.name) === subjectNameKey(choice.sourceName),
      );
      if (matches.length > 1)
        throw new RangeError(
          `Для «${choice.sourceName}» есть несколько дисциплин. Выберите нужную.`,
        );
      // Includes subjects created earlier in this import and concurrent imports.
      subject =
        matches[0] ??
        (await tx.subject.upsert({
          select: { id: true, name: true },
          where: { name: choice.sourceName.trim() },
          update: {},
          create: { name: choice.sourceName.trim() },
        }));
      const subjectId = subject.id;
      if (!catalog.some((s) => s.id === subjectId)) catalog.push(subject);
    }
    resolved.set(choice.sourceName, subject);
  }
  return resolved;
}
