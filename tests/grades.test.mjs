import assert from "node:assert/strict";
import test from "node:test";
import { calculateSemester, calculateOverall, createSubject, filterSubjects, isLowGrade } from "../lib/grades.ts";
function subject(grades = ["8", "6", "10", "4", "9"], formula) {
  const value = createSubject("test", "Test");
  value.stages.forEach((stage, index) => stage.grade = grades[index]);
  if (formula !== undefined) value.formula = formula;
  return value;
}
test("five flat stages use 15/15/15/15/40 weights", () => {
  const value = subject();
  assert.equal(value.stages.length, 5);
  assert.ok(Math.abs(calculateSemester(value).value - 7.8) < 1e-10);
  assert.equal(calculateSemester(subject(["10", "10", "10", "10", "10"])).value, 10);
});
test("custom formulas support percentages, decimals, parentheses and precedence", () => {
  assert.equal(calculateSemester(subject(undefined, "(g1 + g2) / 2")).value, 7);
  assert.equal(calculateSemester(subject(undefined, "g1 * 0,5 + g2 * 50%")).value, 7);
  assert.equal(calculateSemester(subject(undefined, "g1 - g2 / 2")).value, 5);
  assert.ok(Math.abs(calculateSemester(subject(undefined, "")).value - 7.8) < 1e-10);
});
test("missing required grades do not produce partial or zero results", () => {
  assert.equal(calculateSemester(subject(["8", "6", "10", "4", ""])).value, null);
  assert.equal(calculateSemester(subject(["8", "", "", "", ""], "g1")).value, 8);
  assert.equal(calculateOverall([createSubject("empty", "Empty")]).average, null);
});
test("invalid grades and unsafe or invalid formulas are rejected", () => {
  for (const formula of ["g1 / 0", "g1 +", "(g1", "g6", "g1 g2", "g1 + 20", "g1 - 10", "process.exit()", "1;2", "1".repeat(501)]) assert.ok(calculateSemester(subject(undefined, formula)).error, formula);
  for (const grade of ["0", "11", "abc", "0x8", "-1"]) assert.ok(calculateSemester(subject([grade, "6", "10", "4", "9"])).error, grade);
});
test("semester filtering and grade edits update overall average", () => {
  const first = subject(["8", "8", "8", "8", "8"]);
  const second = { ...subject(["4", "4", "4", "4", "4"]), id: "second", semester: 2 };
  assert.equal(calculateOverall([first, second]).average, 6);
  assert.equal(calculateOverall(filterSubjects([first, second], 1)).average, 8);
  assert.equal(filterSubjects([first], 2).length, 0);
  first.stages[4].grade = "10";
  assert.ok(Math.abs(calculateOverall([first]).average - 8.8) < 1e-10);
});
test("warnings use unrounded individual grades independently of the final result", () => {
  assert.ok(calculateSemester(subject()).value > 5);
  assert.equal(isLowGrade("4"), true);
  assert.equal(isLowGrade("4,999"), true);
  for (const value of ["5", "", "0", "invalid"]) assert.equal(isLowGrade(value), false);
});
test("new subjects have independent grades and formulas", () => {
  const first = createSubject("a", "A");
  const second = createSubject("b", "B");
  first.stages[0].grade = "9";
  first.formula = "g1";
  assert.equal(second.stages[0].grade, "");
  assert.notEqual(second.formula, first.formula);
});
