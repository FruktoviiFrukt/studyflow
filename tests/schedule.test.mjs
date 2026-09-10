import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  mondayOf,
  universityToday,
  getDemoLessons,
} from "../lib/schedule.ts";

test("week navigation crosses month, year and leap-day boundaries", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(mondayOf("2026-09-13"), "2026-09-07");
  assert.equal(mondayOf("2026-09-14"), "2026-09-14");
});

test("university date follows Chisinau rather than UTC at midnight", () => {
  assert.equal(universityToday(new Date("2026-09-07T21:30:00Z")), "2026-09-08");
  assert.equal(universityToday(new Date("2026-01-01T21:30:00Z")), "2026-01-01");
});

test("date-only navigation is unaffected by the daylight-saving weekend", () => {
  assert.equal(addDays("2026-03-28", 2), "2026-03-30");
  assert.equal(addDays("2026-10-24", 2), "2026-10-26");
});

test("weekly fixtures move with the week and have unique identities", () => {
  const first = getDemoLessons("2026-09-07");
  const next = getDemoLessons("2026-09-14");
  assert.equal(new Set(first.map((lesson) => lesson.id)).size, first.length);
  assert.deepEqual(
    next.map((lesson) => lesson.date),
    first.map((lesson) => addDays(lesson.date, 7)),
  );
  assert.equal(
    next.some((lesson) => first.some((old) => old.id === lesson.id)),
    false,
  );
});
