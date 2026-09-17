import assert from "node:assert/strict";
import test from "node:test";
import {
  isWellFormedQuestion,
  normalizeQuestionText,
  questionTextHash,
} from "../lib/server/question-bank.ts";

test("normalization ignores case, punctuation and spacing, keeps Cyrillic", () => {
  assert.equal(
    normalizeQuestionText("  Что такое   ООП?! "),
    normalizeQuestionText("что такое ооп"),
  );
  assert.equal(
    questionTextHash("Что такое ООП?"),
    questionTextHash("что  такое ооп"),
  );
  assert.notEqual(
    questionTextHash("Что такое ООП?"),
    questionTextHash("Что такое SOLID?"),
  );
});

test("well-formed check enforces option counts and a single correct answer", () => {
  const mc = (flags) => ({
    text: "Q",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    options: flags.map((isCorrect, i) => ({ text: `o${i}`, isCorrect })),
  });
  assert.equal(isWellFormedQuestion(mc([true, false, false, false])), true);
  assert.equal(isWellFormedQuestion(mc([true, true, false, false])), false);
  assert.equal(isWellFormedQuestion(mc([false, false, false, false])), false);
  assert.equal(isWellFormedQuestion(mc([true, false, false])), false);
  assert.equal(
    isWellFormedQuestion({ ...mc([true, false]), type: "TRUE_FALSE" }),
    true,
  );
  assert.equal(
    isWellFormedQuestion({
      ...mc([true, false, false, false]),
      type: "TRUE_FALSE",
    }),
    false,
  );
  assert.equal(
    isWellFormedQuestion({ ...mc([true, false, false, false]), text: "  " }),
    false,
  );
});
