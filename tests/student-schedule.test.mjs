import assert from "node:assert/strict";
import test from "node:test";
import {
  academicWeek,
  calculateStudentSchedule,
} from "../lib/server/student-schedule.ts";

const date = (s) => new Date(`${s}T00:00:00Z`);
const student = { groupId: "g1" };
function fixture() {
  const make = (id, weekPattern, subgroupId = null) => ({
    id,
    weekday: 0,
    startMinutes: 1125,
    endMinutes: 1215,
    weekPattern,
    type: "LECTURE",
    teacher: null,
    classroom: "611",
    topic: null,
    subject: { id: "math", name: "Математика", colorKey: "blue" },
    audiences: [{ groupId: "g1", subgroupId }],
  });
  return {
    id: "schedule",
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
      make("odd", "ODD"),
      make("even", "EVEN"),
      make("all", "EVERY"),
      make("sub1", "EVERY", "s1"),
      make("sub2", "EVERY", "s2"),
      {
        ...make("other", "EVERY"),
        audiences: [{ groupId: "g2", subgroupId: null }],
      },
    ],
  };
}
const run = (schedule, from = "2026-09-14", to = from, membership = student) =>
  calculateStudentSchedule({
    from,
    to,
    student: membership,
    schedules: [schedule],
  });

test("academic weeks continue across semesters, year boundary and DST", () => {
  for (const [day, number, parity] of [
    ["2026-08-31", 1, "ODD"],
    ["2026-09-06", 1, "ODD"],
    ["2026-09-07", 2, "EVEN"],
    ["2026-10-26", 9, "ODD"],
    ["2027-01-04", 19, "ODD"],
  ]) {
    assert.deepEqual(academicWeek(day, "2026-08-31"), { number, parity });
  }
  assert.equal(academicWeek("2026-08-30", "2026-08-31"), null);
  assert.throws(() => academicWeek("2026-09-14", "2026-09-01"), RangeError);
});

test("shows both parallel options to the group and filters parity", () => {
  const s = fixture();
  s.lessons[2].audiences.push(
    { groupId: "g2", subgroupId: null },
    { groupId: "g1", subgroupId: "s1" },
  );
  const day = run(s).days[0];
  assert.deepEqual(
    day.lessons.map((l) => l.lessonId),
    ["all", "odd", "sub1", "sub2"],
  );
  assert.equal(day.lessons[0].startMinutes, 1125);
  assert.equal(day.lessons[0].endMinutes, 1215);
  assert.equal(day.lessons[0].topic, null);
  assert.deepEqual(
    run(s, "2026-09-21").days[0].lessons.map((l) => l.lessonId),
    ["all", "even", "sub1", "sub2"],
  );
  assert.notEqual(
    day.lessons[0].id,
    run(s, "2026-09-21").days[0].lessons[0].id,
  );
});

test("inclusive overlapping holidays suppress lessons without deleting rules or changing parity", () => {
  const s = fixture();
  s.holidays = [
    {
      id: "break",
      name: "Каникулы",
      startsOn: date("2026-09-14"),
      endsOn: date("2026-09-20"),
    },
    {
      id: "day",
      name: "Выходной",
      startsOn: date("2026-09-14"),
      endsOn: date("2026-09-14"),
    },
  ];
  const before = structuredClone(s);
  const days = run(s, "2026-09-13", "2026-09-21").days;
  assert.equal(days[0].status, "NO_LESSONS");
  assert.equal(days[1].holidays.length, 2);
  assert.ok(
    days.slice(1, 8).every((d) => d.status === "HOLIDAY" && !d.lessons.length),
  );
  assert.equal(days[8].week.parity, "EVEN");
  assert.equal(days[8].status, "LESSONS");
  assert.deepEqual(s, before);
});

test("intersects year, semester and publication bounds and keeps empty days distinct", () => {
  const s = fixture();
  s.validFrom = date("2026-09-13");
  s.validTo = date("2026-09-16");
  s.semester.endsOn = date("2026-09-15");
  const days = run(s, "2026-09-12", "2026-09-16").days;
  assert.deepEqual(
    days.map((d) => d.status),
    ["NOT_PUBLISHED", "NO_LESSONS", "LESSONS", "NO_LESSONS", "NOT_PUBLISHED"],
  );
  s.semester.academicYear.endsOn = date("2026-09-13");
  assert.equal(run(s).days[0].status, "NOT_PUBLISHED");
  s.status = "DRAFT";
  assert.equal(run(s).days[0].status, "NOT_PUBLISHED");
});

test("only a group is required in the profile", () => {
  assert.equal(
    run(fixture(), undefined, undefined, { groupId: null }).status,
    "PROFILE_REQUIRED",
  );
  assert.equal(
    run(fixture(), undefined, undefined, { groupId: "g1" }).status,
    "READY",
  );
});

test("invalid dates and excessive/reversed ranges are rejected; leap day is supported", () => {
  for (const invalid of [
    "2026-02-29",
    "2026-04-31",
    "2026-9-01",
    "garbage",
    "2026-09-14T00:00:00Z",
  ])
    assert.throws(() => run(fixture(), invalid), RangeError);
  assert.throws(() => run(fixture(), "2026-09-15", "2026-09-14"), RangeError);
  assert.throws(() => run(fixture(), "2026-01-01", "2027-01-02"), RangeError);
  assert.equal(academicWeek("2028-02-29", "2028-02-28").number, 1);
});

test("conflicting publications fail explicitly and unrelated schedules cannot suppress lessons", () => {
  const s = fixture(),
    other = fixture();
  other.id = "other";
  assert.throws(
    () =>
      calculateStudentSchedule({
        from: "2026-09-14",
        to: "2026-09-14",
        student,
        schedules: [s, other],
      }),
    /Несколько опубликованных/,
  );
  other.lessons = other.lessons.filter((l) => l.id === "other");
  other.holidays = [
    {
      id: "break",
      name: "Other holiday",
      startsOn: date("2026-09-14"),
      endsOn: date("2026-09-14"),
    },
  ];
  assert.equal(
    calculateStudentSchedule({
      from: "2026-09-14",
      to: "2026-09-14",
      student,
      schedules: [s, other],
    }).days[0].status,
    "LESSONS",
  );
});

test("second semester uses year anchor; new academic year has its own anchor", () => {
  const s = fixture();
  s.semester.startsOn = date("2027-01-01");
  assert.deepEqual(run(s, "2027-01-04").days[0].week, {
    number: 19,
    parity: "ODD",
  });
  const next = fixture();
  next.validFrom = date("2027-09-01");
  next.validTo = date("2028-01-01");
  next.semester.startsOn = date("2027-09-01");
  next.semester.endsOn = date("2028-01-01");
  next.semester.academicYear = {
    startsOn: date("2027-09-01"),
    endsOn: date("2028-08-31"),
    firstOddWeekMonday: date("2027-08-30"),
  };
  assert.deepEqual(run(next, "2027-09-06").days[0].week, {
    number: 2,
    parity: "EVEN",
  });
});
