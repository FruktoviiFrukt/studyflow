import assert from "node:assert/strict";
import test from "node:test";
import { calculateGlobalTemplate } from "../lib/server/global-schedule-template.ts";
import {
  adminGlobalTemplate,
  templateCells,
} from "../lib/global-template-view.ts";

const date = (value) => new Date(`${value}T00:00:00Z`);
const groups = [
  { id: "g1", name: "TI-241" },
  { id: "g2", name: "TI-242" },
];
function schedule(id, semester = 1, course = 3) {
  return {
    id,
    semesterId: `sem-${semester}`,
    kind: "GLOBAL",
    course,
    status: "PUBLISHED",
    validFrom: date("2026-09-01"),
    semester: {
      number: semester,
      academicYear: { name: "2026/2027", startsOn: date("2026-09-01") },
    },
    lessons: [
      {
        id: `lesson-${id}`,
        weekday: 0,
        startMinutes: 585,
        endMinutes: 675,
        weekPattern: "ODD",
        type: "LECTURE",
        teacher: null,
        classroom: "301",
        topic: null,
        subject: { id: "math", name: "Математика", colorKey: "blue" },
        audiences: [{ groupId: "g1" }, { groupId: "g2" }],
      },
    ],
  };
}

test("weekly template keeps all groups and parity without selecting a date", () => {
  const result = calculateGlobalTemplate([schedule("first")], groups, 3, 1);
  assert.equal(result.course, 3);
  assert.equal(result.academicYear, "2026/2027");
  assert.equal(result.semester, 1);
  assert.deepEqual(result.groups, groups);
  assert.deepEqual(result.days[0].lessons[0].groupIds, ["g1", "g2"]);
  assert.equal(result.days[0].lessons[0].weekPattern, "ODD");
  assert.equal(result.days.length, 7);
  assert.equal(result.days[0].lessons[0].date, undefined);
});

test("course and semester are selected independently of the viewer", () => {
  assert.equal(
    calculateGlobalTemplate(
      [schedule("first"), schedule("second", 2)],
      groups,
      3,
      2,
    ).semester,
    2,
  );
  assert.equal(
    calculateGlobalTemplate(
      [schedule("first"), schedule("other", 1, 2)],
      groups,
      2,
      1,
    ).days[0].lessons[0].id,
    "lesson-other",
  );
  assert.deepEqual(
    calculateGlobalTemplate([schedule("first")], groups, 2, 2).groups,
    [],
  );
  assert.throws(
    () => calculateGlobalTemplate([schedule("a"), schedule("b")], groups, 3, 1),
    /Несколько/,
  );
});

test("admin preview uses all audiences and merges a shared lesson", () => {
  const result = adminGlobalTemplate([
    {
      id: "shared",
      day: 0,
      start: "09:45",
      end: "11:15",
      parity: "odd",
      subject: "Математика",
      type: "Лекция",
      teacher: "",
      room: "301",
      topic: "",
      audiences: [
        { group: "TI-241", subgroup: "all" },
        { group: "TI-242", subgroup: "all" },
      ],
    },
  ]);
  assert.deepEqual(
    result.groups.map((group) => group.name),
    ["TI-241", "TI-242"],
  );
  assert.deepEqual(
    templateCells(result.days[0].lessons, result.groups, {
      startMinutes: 585,
      endMinutes: 675,
    }).map((cell) => cell.span),
    [2],
  );
});
