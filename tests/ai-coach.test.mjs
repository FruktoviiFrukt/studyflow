import assert from "node:assert/strict";
import test from "node:test";
import { getGenerationReadiness } from "../lib/ai-coach.ts";

test("generation requires both a subject and notes", () => {
  for (const hasSubject of [false, true]) {
    for (const hasNotes of [false, true]) {
      const result = getGenerationReadiness({ hasSubject, hasNotes });
      assert.equal(result.canGenerate, hasSubject && hasNotes);
      assert.equal(result.hint === null, hasSubject && hasNotes);
    }
  }
});
