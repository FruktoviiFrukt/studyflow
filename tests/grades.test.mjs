import assert from "node:assert/strict";
import test from "node:test";
import { calculateOverall, calculateStage, createStage, createSubject, filterSubjects, gradeStatus, isLowGrade, subjectGrade } from "../lib/grades.ts";

function stage(formula = "", grades = ["8", "6"]) {
  const result = createStage("test", "Аттестация 1");
  return { ...result, formula, parts: result.parts.map((part, index) => ({ ...part, grade: grades[index] })) };
}

test("default formula averages all parts and adapts to additions and deletions", () => {
  const value = stage();
  assert.equal(calculateStage(value).value, 7);
  value.parts.push({ id: "third", variable: "g3", name: "Проект", grade: "10" });
  assert.equal(calculateStage(value).value, 8);
  value.parts.splice(1, 1);
  assert.equal(calculateStage(value).value, 9);
});

test("custom formulas support weights, precedence, parentheses and decimal commas", () => {
  assert.equal(calculateStage(stage("g1 * 0.4 + g2 * 0.6")).value, 6.8);
  assert.equal(calculateStage(stage("(g1 + g2) / 2")).value, 7);
  assert.equal(calculateStage(stage("g1 - g2 / 2")).value, 5);
  assert.equal(calculateStage(stage("(G1 + g2) / 2", ["8,5", "6,5"])).value, 7.5);
  assert.equal(calculateStage(stage("g1 * 0,5 + g2 * 0,5")).value, 7);
});

test("blank grades and empty stages never count as zero", () => {
  assert.deepEqual(calculateStage(stage("", ["", "6"])), { value: null });
  assert.deepEqual(calculateStage({ ...stage(), parts: [] }), { value: null });
  assert.equal(calculateStage(stage("g2", ["", "6"])).value, 6);
});

test("invalid grades are rejected", () => {
  for (const grade of ["0", "11", "-1", "abc", "Infinity", "0x8", "1e1"]) {
    assert.ok(calculateStage(stage("", [grade, "6"])).error, grade);
  }
});

test("malformed, unsafe, out-of-range and zero-division formulas are rejected", () => {
  for (const formula of ["g1 / 0", "g1 / (g2 - g2)", "g1 +", "(g1 + g2", "g1 g2", "g3", "g1 + g2", "g1 - 10", "Math.max(g1,g2)", "globalThis.process.exit()", "1;2", "1".repeat(501)]) {
    assert.ok(calculateStage(stage(formula)).error, formula);
  }
});

test("deleted variables produce an error instead of silently changing the calculation", () => {
  const value = stage("(g1 + g2) / 2");
  value.parts.pop();
  assert.match(calculateStage(value).error, /g2/);
});

test("risk threshold uses the unrounded result and excludes exactly five", () => {
  assert.equal(gradeStatus(calculateStage(stage("", ["4", "5"])).value), "Нужно подтянуть");
  assert.equal(gradeStatus(calculateStage(stage("", ["4,999", "4,999"])).value), "Нужно подтянуть");
  assert.equal(gradeStatus(5), "Удовлетворительно");
  assert.equal(gradeStatus(null), "Нет оценки");
});

test("new subjects have independent empty assessments", () => {
  const first = createSubject("first", "Первый");
  const second = createSubject("second", "Второй");
  first.stages[0].parts[0].grade = "9";
  assert.equal(second.stages[0].parts[0].grade, "");
  assert.equal(first.stages[1].parts[0].grade, "");
  assert.deepEqual(first.stages.map(item => item.name), ["Аттестация 1", "Аттестация 2", "Экзамен"]);
  assert.equal(calculateStage(first.stages[2]).value, null);
  first.stages[2].parts[0].grade = "8";
  assert.equal(calculateStage(first.stages[2]).value, 8);
  assert.equal(second.stages[2].parts[0].grade, "");
});

test("overall average weights subjects equally and excludes missing results", () => {
  const subjects = [
    { id: "a", name: "A", stages: [stage("", ["10", "10"]), stage("", ["6", "6"])] },
    { id: "b", name: "B", stages: [stage("", ["4", "4"])] },
    createSubject("empty", "Empty"),
  ];
  assert.deepEqual(calculateOverall(subjects), { average: 6, countedSubjects: 2 });
  assert.deepEqual(calculateOverall([]), { average: null, countedSubjects: 0 });
  assert.deepEqual(calculateOverall([createSubject("empty", "Empty")]), { average: null, countedSubjects: 0 });
});

test("low subgrades trigger risk even with a passing or incomplete stage", () => {
  assert.equal(calculateStage(stage("", ["4", "10"])).value, 7);
  assert.equal(isLowGrade("4"), true);
  assert.equal(calculateStage(stage("", ["4", ""])).value, null);
  assert.equal(isLowGrade("4,999"), true);
  for (const input of ["5", "10", "", " ", "abc", "0", "-1", "11", "0x4"]) {
    assert.equal(isLowGrade(input), false, input);
  }
});

test("semester filters restrict subjects and the displayed average", () => {
  const subjects = [
    { ...createSubject("a", "A", 1), gradeOverride: 8 },
    { ...createSubject("b", "B", 2), gradeOverride: 4 },
  ];
  assert.equal(filterSubjects(subjects, "all").length, 2);
  assert.equal(calculateOverall(filterSubjects(subjects, "all")).average, 6);
  assert.equal(calculateOverall(filterSubjects(subjects, 1)).average, 8);
  assert.equal(calculateOverall(filterSubjects(subjects, 2)).average, 4);
  assert.deepEqual(filterSubjects([subjects[0]], 2), []);
  assert.equal(subjects.length, 2);
});

test("manual grade changes update averages and returning to automatic preserves stages", () => {
  const subject = { ...createSubject("a", "A"), stages: [stage("", ["8", "6"])] };
  assert.equal(subjectGrade(subject), 7);
  const manual = { ...subject, gradeOverride: 10 };
  assert.equal(calculateOverall([manual]).average, 10);
  assert.equal(calculateStage(manual.stages[0]).value, 7);
  const automatic = { ...manual, gradeOverride: null };
  assert.equal(subjectGrade(automatic), 7);
  automatic.stages[0].parts[0].grade = "10";
  assert.equal(calculateOverall([automatic]).average, 8);
});
