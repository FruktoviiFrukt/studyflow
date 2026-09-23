import assert from "node:assert/strict";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { emptyLesson, matchesStudent, lessonOnDate } = await tsImport(
  "../lib/admin-schedule.ts",
  import.meta.url,
);

const assessment = {
  ...emptyLesson(),
  parity: "once",
  date: "2024-10-21",
  day: 0,
  audiences: [{ group: "TI-242", subgroup: "all" }],
};

test("dated assessments survive both parity filters for their group", () => {
  for (const parity of ["odd", "even"]) {
    assert.equal(matchesStudent(assessment, "TI-242", parity), true);
    assert.equal(matchesStudent(assessment, "TI-241", parity), false);
  }
});

test("assessments appear only on their actual date, not every matching weekday", () => {
  assert.equal(lessonOnDate(assessment, "2024-10-21", 0), true);
  assert.equal(lessonOnDate(assessment, "2024-10-28", 0), false);
  assert.equal(lessonOnDate(assessment, "2024-10-22", 1), false);
  assert.equal(
    lessonOnDate({ ...assessment, date: undefined }, "2024-10-21", 0),
    false,
  );
});

test("recurring lessons retain weekday and parity filtering", () => {
  const weekly = { ...assessment, date: undefined, parity: "odd" };
  assert.equal(matchesStudent(weekly, "TI-242", "odd"), true);
  assert.equal(matchesStudent(weekly, "TI-242", "even"), false);
  assert.equal(lessonOnDate(weekly, "2024-10-21", 0), true);
  assert.equal(lessonOnDate(weekly, "2024-10-28", 0), true);
  assert.equal(lessonOnDate(weekly, "2024-10-22", 1), false);
});
