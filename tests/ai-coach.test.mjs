import assert from "node:assert/strict";
import test from "node:test";
import { getGenerationReadiness } from "../lib/ai-coach.ts";

test("generation requires text notes to be present", () => {
  assert.equal(getGenerationReadiness({ hasNotes: false }).canGenerate, false);
  assert.equal(getGenerationReadiness({ hasNotes: true }).canGenerate, true);
  assert.equal(getGenerationReadiness({ hasNotes: false }).hint !== null, true);
  assert.equal(getGenerationReadiness({ hasNotes: true }).hint, null);
});

test("generation is blocked when question count is below minimum", () => {
  for (const questionCount of [0, 1, 2, 4]) {
    const result = getGenerationReadiness({ hasNotes: true, questionCount });
    assert.equal(
      result.canGenerate,
      false,
      `count=${questionCount} should be blocked`,
    );
    assert.ok(result.hint !== null);
  }
});

test("generation is allowed at minimum question count and above", () => {
  for (const questionCount of [5, 10, 15, 20]) {
    const result = getGenerationReadiness({ hasNotes: true, questionCount });
    assert.equal(
      result.canGenerate,
      true,
      `count=${questionCount} should be allowed`,
    );
    assert.equal(result.hint, null);
  }
});
