import assert from "node:assert/strict";
import test from "node:test";
import { calculateGlobalSchedule } from "../lib/server/global-schedule.ts";

const date = (value) => new Date(`${value}T00:00:00Z`);
const groups = [
  { id: "g2", name: "TI-242" },
  { id: "g1", name: "TI-241" },
  { id: "unused", name: "TI-243" },
];
function fixture() {
  const lesson = (id, groupIds, weekPattern = "EVERY") => ({
    id,
    weekday: 0,
    startMinutes: 585,
    endMinutes: 675,
    weekPattern,
    type: "LECTURE",
    teacher: null,
    classroom: "301",
    topic: null,
    subject: { id: "math", name: "Математика", colorKey: "blue" },
    audiences: groupIds.map((groupId) => ({ groupId, subgroupId: null })),
  });
  return {
    id: "global",
    kind: "GLOBAL",
    course: 3,
    status: "PUBLISHED",
    validFrom: date("2026-09-01"),
    validTo: date("2027-06-30"),
    semester: {
      startsOn: date("2026-09-01"),
      endsOn: date("2027-06-30"),
      academicYear: {
        startsOn: date("2026-09-01"),
        endsOn: date("2027-08-31"),
        firstOddWeekMonday: date("2026-08-31"),
      },
    },
    holidays: [],
    lessons: [
      lesson("shared", ["g1", "g2"]),
      lesson("odd", ["g1"], "ODD"),
      lesson("even", ["g2"], "EVEN"),
    ],
  };
}
const run = (schedules, from = "2026-09-14", to = from) =>
  calculateGlobalSchedule({ course: 3, from, to, groups, schedules });

test("shared lessons occur once, retain all groups and filter parity", () => {
  const schedule = fixture();
  const result = run([schedule]);
  assert.deepEqual(
    result.groups.map((group) => group.id),
    ["g1", "g2"],
  );
  assert.deepEqual(
    result.days[0].lessons.map((lesson) => lesson.lessonId),
    ["odd", "shared"],
  );
  assert.deepEqual(
    result.days[0].lessons.find((lesson) => lesson.lessonId === "shared")
      .groupIds,
    ["g1", "g2"],
  );
  assert.deepEqual(
    result.days[0].groupStates.map((state) => state.status),
    ["LESSONS", "LESSONS"],
  );
  assert.deepEqual(
    run([schedule], "2026-09-21").days[0].lessons.map(
      (lesson) => lesson.lessonId,
    ),
    ["even", "shared"],
  );
});

test("holidays suppress lessons, while publication and parity keep their dates", () => {
  const schedule = fixture();
  schedule.holidays.push({
    id: "holiday",
    name: "Каникулы",
    startsOn: date("2026-09-14"),
    endsOn: date("2026-09-14"),
  });
  const days = run([schedule], "2026-09-14", "2026-09-20").days;
  assert.deepEqual(
    days[0].groupStates.map((state) => state.status),
    ["HOLIDAY", "HOLIDAY"],
  );
  assert.equal(days[0].lessons.length, 0);
  assert.equal(
    run([schedule], "2026-09-21").days[0].groupStates[0].week.parity,
    "EVEN",
  );
  assert.equal(days[1].groupStates[0].status, "NO_LESSONS");
});

test("different groups may use different publications, but one group cannot have two", () => {
  const first = fixture();
  const second = fixture();
  second.id = "second";
  second.lessons = second.lessons.filter((lesson) => lesson.id === "shared");
  second.lessons[0].id = "other";
  second.lessons[0].audiences = [{ groupId: "g2", subgroupId: null }];
  first.lessons.forEach((lesson) => {
    lesson.audiences = lesson.audiences.filter(
      (audience) => audience.groupId === "g1",
    );
  });
  assert.deepEqual(
    run([first, second]).days[0].groupStates.map((state) => state.scheduleId),
    ["global", "second"],
  );
  second.lessons[0].audiences.push({ groupId: "g1", subgroupId: null });
  assert.throws(() => run([first, second]), /Несколько опубликованных/);
});

test("only published global schedules of the selected course are used", () => {
  const student = { ...fixture(), id: "student", kind: "STUDENT" };
  const otherCourse = { ...fixture(), id: "other", course: 2 };
  const draft = { ...fixture(), id: "draft", status: "DRAFT" };
  const result = run([student, otherCourse, draft], "2026-09-14", "2026-09-15");
  assert.deepEqual(result.groups, []);
  assert.equal(result.days.length, 2);
  assert.ok(
    result.days.every((day) => !day.groupStates.length && !day.lessons.length),
  );
});

test("the period is at most seven days and publication bounds are inclusive", () => {
  const schedule = fixture();
  schedule.validFrom = date("2026-09-15");
  assert.deepEqual(
    run([schedule], "2026-09-14", "2026-09-15").days[0].groupStates.map(
      (state) => state.status,
    ),
    ["NOT_PUBLISHED", "NOT_PUBLISHED"],
  );
  assert.throws(() => run([schedule], "2026-09-14", "2026-09-21"), RangeError);
});
