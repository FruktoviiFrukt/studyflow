import test from "node:test";
import assert from "node:assert/strict";
import { tsImport } from "tsx/esm/api";
const { previewSubjectMatches, validateSubjectChoices } = await tsImport(
  "../lib/subject-matching.ts",
  import.meta.url,
);
const catalog = [
  { id: "1", name: "Algebra liniară", code: null, status: "ARCHIVED" },
  {
    id: "2",
    name: "Algebra liniară și geometria",
    code: "ALG",
    status: "ACTIVE",
  },
  { id: "3", name: "Fizica", code: null, status: "ACTIVE" },
];
test("matching preserves source spelling, deduplicates repeated names and separates exact from suggestions", () => {
  const result = previewSubjectMatches(
    ["  ALGEBRA   LINIARĂ ", "Algebra liniara", "Fizica", "Fizica", "New"],
    catalog,
    5,
  );
  assert.equal(result.subjects.length, 4);
  assert.equal(result.subjects[0].sourceName, "  ALGEBRA   LINIARĂ ");
  assert.deepEqual(result.subjects[0].exactIds, ["1"]);
  assert.deepEqual(result.subjects[1].exactIds, []);
  assert.ok(result.subjects[1].suggestedIds.includes("1"));
  assert.deepEqual(result.subjects[3].suggestedIds, []);
  assert.equal(result.catalog[0].status, "ARCHIVED");
});
test("ambiguous normalized names remain multiple candidates", () => {
  const result = previewSubjectMatches(
    ["fizica"],
    [...catalog, { ...catalog[2], id: "4", name: "FIZICA" }],
    1,
  );
  assert.deepEqual(result.subjects[0].exactIds, ["3", "4"]);
});
test("every extracted name must have an explicit, well-formed unique decision", () => {
  assert.deepEqual(
    validateSubjectChoices(
      [
        { sourceName: "A", subjectId: null },
        { sourceName: "B", subjectId: "existing" },
      ],
      ["A", "A", "B"],
    ).length,
    2,
  );
  for (const value of [
    null,
    [],
    [
      { sourceName: "A", subjectId: null },
      { sourceName: "A", subjectId: null },
    ],
    [
      { sourceName: "A", subjectId: "" },
      { sourceName: "B", subjectId: null },
    ],
    [
      { sourceName: "A", subjectId: 12 },
      { sourceName: "B", subjectId: null },
    ],
    [
      { sourceName: "A", subjectId: null },
      { sourceName: "C", subjectId: null },
    ],
  ])
    assert.throws(() => validateSubjectChoices(value, ["A", "B"]), RangeError);
});
