import assert from "node:assert/strict";
import test from "node:test";
import { GPA_LIMITS, isValidGradeSubjects } from "../lib/gpa-profile.ts";
import { createSubject, initialSubjects } from "../lib/grades.ts";

test("demo subjects and freshly created subjects pass validation", () => {
  assert.equal(isValidGradeSubjects(initialSubjects), true);
  assert.equal(isValidGradeSubjects([createSubject("x", "New", 2)]), true);
  assert.equal(isValidGradeSubjects([]), true);
});

test("non-array and malformed payloads are rejected", () => {
  for (const value of [null, undefined, "[]", {}, 42, [null], ["subject"]]) {
    assert.equal(isValidGradeSubjects(value), false, JSON.stringify(value));
  }
});

test("each subject field is type-checked", () => {
  const valid = createSubject("id", "Name");
  const broken = [
    { ...valid, id: 1 },
    { ...valid, name: null },
    { ...valid, semester: 3 },
    { ...valid, semester: "1" },
    { ...valid, formula: ["g1"] },
    { ...valid, stages: "none" },
    { ...valid, stages: [{ variable: "g1", name: "Stage", grade: 8 }] },
    { ...valid, stages: [{ variable: "g1", name: "Stage" }] },
  ];
  for (const subject of broken) {
    assert.equal(
      isValidGradeSubjects([subject]),
      false,
      JSON.stringify(subject),
    );
  }
});

test("duplicate subject ids are rejected", () => {
  const a = createSubject("same", "A");
  const b = createSubject("same", "B");
  assert.equal(isValidGradeSubjects([a, b]), false);
});

test("payload size limits are enforced", () => {
  const many = Array.from({ length: GPA_LIMITS.subjects + 1 }, (_, i) =>
    createSubject(`s${i}`, `Subject ${i}`),
  );
  assert.equal(isValidGradeSubjects(many), false);
  assert.equal(isValidGradeSubjects(many.slice(0, GPA_LIMITS.subjects)), true);

  const longName = createSubject("n", "x".repeat(GPA_LIMITS.text + 1));
  assert.equal(isValidGradeSubjects([longName]), false);

  const longFormula = createSubject("f", "F");
  longFormula.formula = "g1 + ".repeat(GPA_LIMITS.formula) + "g1";
  assert.equal(isValidGradeSubjects([longFormula]), false);

  const manyStages = createSubject("st", "S");
  manyStages.stages = Array.from({ length: GPA_LIMITS.stages + 1 }, (_, i) => ({
    variable: `g${i}`,
    name: `Stage ${i}`,
    grade: "",
  }));
  assert.equal(isValidGradeSubjects([manyStages]), false);
});
