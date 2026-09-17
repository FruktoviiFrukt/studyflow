import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyLesson,
  exampleLessons,
  initialSchedules,
  lessonErrors,
  matchesStudent,
  publishDemo,
  scheduleIssues,
} from "../lib/admin-schedule.ts";

test("student preview includes shared lessons and only the selected subgroup and parity", () => {
  const lessons = exampleLessons();
  const ids = lessons
    .filter((l) => matchesStudent(l, "SI-261", "2", "even"))
    .map((l) => l.id);
  assert.ok(ids.includes("demo-2"));
  assert.ok(ids.includes("demo-3"));
  assert.ok(ids.includes("demo-5"));
  assert.ok(!ids.includes("demo-1"));
  assert.ok(!ids.includes("demo-4"));
  assert.ok(!ids.includes("demo-7"));
  assert.deepEqual(
    lessons
      .filter((l) => matchesStudent(l, "SI-262", "1", "odd"))
      .map((l) => l.id),
    ["demo-3"],
  );
});

test("validation rejects invalid time, empty groups and overlapping recipients", () => {
  const base = {
    ...emptyLesson(),
    subject: "Test",
    audiences: [{ group: "SI-261", subgroup: "all" }],
  };
  assert.deepEqual(lessonErrors({ ...base, start: "18:45", end: "20:15" }), []);
  assert.ok(lessonErrors({ ...base, end: "07:00" }).length);
  assert.ok(lessonErrors({ ...base, start: "25:00" }).length);
  assert.ok(lessonErrors({ ...base, audiences: [] }).length);
  assert.ok(
    lessonErrors({
      ...base,
      audiences: [...base.audiences, { group: " si-261 ", subgroup: "1" }],
    }).length,
  );
});

test("conflicts respect subgroup and week parity and detect time overlaps", () => {
  const a = { ...exampleLessons()[0], reviewed: true };
  assert.deepEqual(
    scheduleIssues([a, { ...a, id: "other", parity: "even" }]),
    [],
  );
  assert.deepEqual(
    scheduleIssues([
      { ...a, audiences: [{ group: "SI-261", subgroup: "1" }] },
      { ...a, id: "other", audiences: [{ group: "SI-261", subgroup: "2" }] },
    ]),
    [],
  );
  assert.equal(
    scheduleIssues([a, { ...a, id: "other", start: "10:00" }]).length,
    1,
  );
  assert.deepEqual(
    scheduleIssues([a, { ...a, id: "other", start: "11:15", end: "12:00" }]),
    [],
  );
});

test("demo publishing blocks unchecked/empty drafts without changing other schedules", () => {
  const records = initialSchedules();
  assert.equal(publishDemo(records, "example-draft"), records);
  const ready = records.map((r) => ({
    ...r,
    lessons: r.lessons.map((l) => ({ ...l, reviewed: true })),
  }));
  ready.push({ ...ready[1], id: "another-course", course: "2" });
  const result = publishDemo(ready, "example-draft");
  assert.equal(
    result.find((r) => r.id === "example-draft").status,
    "published",
  );
  assert.equal(
    result.find((r) => r.id === "example-published").status,
    "published",
  );
  assert.equal(
    result.find((r) => r.id === "another-course").status,
    "published",
  );
  assert.equal(ready[0].status, "draft");
  const empty = [{ ...ready[0], lessons: [] }];
  assert.equal(publishDemo(empty, empty[0].id), empty);
});
