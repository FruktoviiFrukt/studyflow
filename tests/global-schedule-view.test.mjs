import assert from "node:assert/strict";
import test from "node:test";
import { globalCells, weekIntervals } from "../lib/global-schedule-view.ts";

const groups = ["g1", "g2", "g3"].map((id) => ({ id, name: id }));
const state = (groupId) => ({
  groupId,
  status: "LESSONS",
  week: { number: 3, parity: "ODD" },
  scheduleId: "schedule",
  holidays: [],
});
const lesson = (id, groupIds, startMinutes = 480, endMinutes = 570) => ({
  id,
  lessonId: id,
  scheduleId: "schedule",
  date: "2026-09-14",
  startMinutes,
  endMinutes,
  groupIds,
  subject: { id: id, name: id, colorKey: "blue" },
  type: "LECTURE",
  teacher: null,
  classroom: null,
  topic: null,
});
const day = (lessons) => ({
  date: "2026-09-14",
  groupStates: groups.map((group) => state(group.id)),
  lessons,
});

test("time rows reflect actual intervals and selected groups", () => {
  const days = [
    day([
      lesson("long", ["g1"], 480, 675),
      lesson("short", ["g2"], 480, 570),
      lesson("later", ["g3"], 585, 675),
    ]),
  ];
  assert.deepEqual(weekIntervals(days), [
    { startMinutes: 480, endMinutes: 570 },
    { startMinutes: 480, endMinutes: 675 },
    { startMinutes: 585, endMinutes: 675 },
  ]);
  assert.deepEqual(weekIntervals(days, new Set(["g3"])), [
    { startMinutes: 585, endMinutes: 675 },
  ]);
});

test("only adjacent columns with the same sole lesson are merged", () => {
  const interval = { startMinutes: 480, endMinutes: 570 };
  assert.deepEqual(
    globalCells(day([lesson("shared", ["g1", "g2"])]), groups, interval).map(
      (cell) => [cell.groupId, cell.span],
    ),
    [
      ["g1", 2],
      ["g3", 1],
    ],
  );
  const parallel = globalCells(
    day([lesson("shared", ["g1", "g2"]), lesson("extra", ["g2"])]),
    groups,
    interval,
  );
  assert.deepEqual(
    parallel.map((cell) => cell.span),
    [1, 1, 1],
  );
  assert.deepEqual(
    parallel[1].lessons.map((item) => item.id),
    ["shared", "extra"],
  );
  assert.deepEqual(
    globalCells(day([lesson("shared", ["g1", "g3"])]), groups, interval).map(
      (cell) => cell.span,
    ),
    [1, 1, 1],
  );
});
