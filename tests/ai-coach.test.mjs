import assert from "node:assert/strict";
import test from "node:test";
import { getGenerationReadiness } from "../lib/ai-coach.ts";

const VALID = { questionCount: 10, allSubjectsHaveTopics: true };

test("generation is blocked when neither notes nor subject provided", () => {
  const result = getGenerationReadiness({
    ...VALID,
    hasNotes: false,
    hasSubject: false,
  });
  assert.equal(result.canGenerate, false);
  assert.ok(result.hint !== null);
});

test("generation is allowed with notes only and no subject", () => {
  const result = getGenerationReadiness({
    ...VALID,
    hasNotes: true,
    hasSubject: false,
  });
  assert.equal(result.canGenerate, true);
  assert.equal(result.hint, null);
});

test("generation is allowed with subject and topics and no notes", () => {
  const result = getGenerationReadiness({
    ...VALID,
    hasNotes: false,
    hasSubject: true,
  });
  assert.equal(result.canGenerate, true);
  assert.equal(result.hint, null);
});

test("generation is allowed when both notes and subject with topics provided", () => {
  const result = getGenerationReadiness({
    ...VALID,
    hasNotes: true,
    hasSubject: true,
  });
  assert.equal(result.canGenerate, true);
  assert.equal(result.hint, null);
});

test("generation is blocked when subject selected but no topics chosen", () => {
  const result = getGenerationReadiness({
    questionCount: 10,
    allSubjectsHaveTopics: false,
    hasNotes: true,
    hasSubject: true,
  });
  assert.equal(result.canGenerate, false);
  assert.ok(result.hint !== null);
});

test("generation is blocked when question count is below minimum", () => {
  for (const questionCount of [0, 1, 5, 9]) {
    const result = getGenerationReadiness({
      questionCount,
      allSubjectsHaveTopics: true,
      hasNotes: true,
      hasSubject: true,
    });
    assert.equal(
      result.canGenerate,
      false,
      `count=${questionCount} should be blocked`,
    );
    assert.ok(result.hint !== null);
  }
});
