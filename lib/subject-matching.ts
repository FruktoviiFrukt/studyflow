export type MatchSubject = {
  id: string;
  name: string;
  code: string | null;
  status: "ACTIVE" | "ARCHIVED";
};
export type SubjectChoice = { sourceName: string; subjectId: string | null };
export type SubjectMatchPreview = {
  subjects: {
    sourceName: string;
    exactIds: string[];
    suggestedIds: string[];
  }[];
  catalog: MatchSubject[];
  lessonCount: number;
};

// Keep course numbers and punctuation. Short uppercase abbreviations remain
// accent-sensitive: their expansion must be confirmed by an administrator.
export function subjectNameKey(name: string) {
  const clean = name.normalize("NFC").trim().replace(/\s+/gu, " ");
  const abbreviation = /^[\p{Lu}]{1,4}$/u.test(clean);
  return (
    abbreviation ? clean : clean.normalize("NFD").replace(/\p{M}/gu, "")
  ).toLocaleLowerCase("ro");
}
function words(name: string) {
  return new Set(
    subjectNameKey(name)
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 2),
  );
}
export function previewSubjectMatches(
  names: string[],
  catalog: MatchSubject[],
  lessonCount: number,
): SubjectMatchPreview {
  return {
    catalog,
    lessonCount,
    subjects: [...new Set(names)].map((sourceName) => {
      const exactIds = catalog
        .filter((s) => subjectNameKey(s.name) === subjectNameKey(sourceName))
        .map((s) => s.id);
      const sourceWords = words(sourceName);
      const suggestedIds = catalog
        .filter((s) => !exactIds.includes(s.id))
        .map((s) => {
          const target = words(s.name);
          const shared = [...sourceWords].filter((w) => target.has(w)).length;
          return {
            id: s.id,
            score: shared / Math.max(sourceWords.size, target.size, 1),
          };
        })
        .filter((s) => s.score >= 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((s) => s.id);
      return { sourceName, exactIds, suggestedIds };
    }),
  };
}

export function validateSubjectChoices(
  value: unknown,
  names: string[],
): SubjectChoice[] {
  const expected = new Set(names);
  if (
    !Array.isArray(value) ||
    value.length !== expected.size ||
    value.length > 2000
  )
    throw new RangeError("Подтвердите сопоставление всех предметов из PDF.");
  const seen = new Set<string>();
  for (const choice of value) {
    if (
      !choice ||
      typeof choice.sourceName !== "string" ||
      !expected.has(choice.sourceName) ||
      seen.has(choice.sourceName) ||
      !(
        choice.subjectId === null ||
        (typeof choice.subjectId === "string" &&
          choice.subjectId.length > 0 &&
          choice.subjectId.length <= 200)
      )
    )
      throw new RangeError(
        "Некорректное сопоставление предметов. Повторите распознавание PDF.",
      );
    seen.add(choice.sourceName);
  }
  return value;
}
