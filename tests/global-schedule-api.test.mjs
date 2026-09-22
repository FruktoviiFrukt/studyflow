import assert from "node:assert/strict";
import test from "node:test";
import { createGlobalScheduleGet } from "../lib/server/global-schedule-api.ts";

const date = (value) => new Date(`${value}T00:00:00Z`);
function schedule() {
  return {
    id: "global",
    kind: "GLOBAL",
    course: 3,
    status: "PUBLISHED",
    sourceFileKey: "secret-pdf-key",
    validFrom: date("2026-09-01"),
    validTo: date("2026-12-31"),
    semester: {
      startsOn: date("2026-09-01"),
      endsOn: date("2026-12-31"),
      academicYear: {
        startsOn: date("2026-09-01"),
        endsOn: date("2027-08-31"),
        firstOddWeekMonday: date("2026-08-31"),
      },
    },
    holidays: [],
    lessons: [
      {
        id: "lecture",
        weekday: 0,
        startMinutes: 585,
        endMinutes: 675,
        weekPattern: "ODD",
        type: "LECTURE",
        teacher: "Teacher",
        classroom: "301",
        topic: null,
        sourceText: "private import text",
        subject: { id: "math", name: "Math", colorKey: "blue" },
        audiences: [
          {
            groupId: "g1",
            subgroupId: null,
            group: { id: "g1", name: "TI-241" },
          },
          {
            groupId: "g2",
            subgroupId: null,
            group: { id: "g2", name: "TI-242" },
          },
        ],
      },
    ],
  };
}

function setup({
  session = { user: { id: "user" } },
  user = { id: "user" },
  schedules = [],
  failure = false,
} = {}) {
  const calls = [];
  const handler = createGlobalScheduleGet({
    authenticate: async () => session,
    db: {
      user: {
        findUnique: async (query) => {
          calls.push(["user", query]);
          if (failure) throw new Error("SECRET_DATABASE_URL");
          return user;
        },
      },
      scheduleImport: {
        findMany: async (query) => {
          calls.push(["schedules", query]);
          return schedules;
        },
      },
    },
  });
  return {
    calls,
    request: (query = "course=3&from=2026-09-14&to=2026-09-20") =>
      handler(new Request(`http://localhost/api/schedule/global?${query}`)),
  };
}

test("global API requires a valid session and current user", async () => {
  for (const session of [null, { user: {} }]) {
    const ctx = setup({ session });
    const response = await ctx.request();
    assert.equal(response.status, 401);
    assert.equal(ctx.calls.length, 0);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
  const deleted = setup({ user: null });
  assert.equal((await deleted.request()).status, 401);
  assert.equal(deleted.calls.length, 1);
});

test("global API rejects missing, duplicate, forged and invalid parameters before DB access", async () => {
  for (const query of [
    "",
    "course=3&from=2026-09-14",
    "course=0&from=2026-09-14&to=2026-09-20",
    "course=11&from=2026-09-14&to=2026-09-20",
    "course=03&from=2026-09-14&to=2026-09-20",
    "course=3&from=2026-02-30&to=2026-03-01",
    "course=3&from=2026-09-14&to=2026-09-21",
    "course=3&from=2026-09-20&to=2026-09-14",
    "course=3&from=2026-09-14&to=2026-09-20&groupId=g1",
    "course=3&from=2026-09-14&to=2026-09-20&course=4",
  ]) {
    const ctx = setup();
    const response = await ctx.request(query);
    assert.equal(response.status, 400, query);
    assert.equal((await response.json()).code, "INVALID_QUERY");
    assert.equal(ctx.calls.length, 0);
  }
});

test("global API reads only published schedules of the course and returns calculated public fields", async () => {
  const ctx = setup({ schedules: [schedule()] });
  const response = await ctx.request();
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.course, 3);
  assert.equal(body.timeZone, "Europe/Chisinau");
  assert.deepEqual(
    body.groups.map((group) => group.name),
    ["TI-241", "TI-242"],
  );
  assert.equal(body.days.length, 7);
  assert.deepEqual(body.days[0].lessons[0].groupIds, ["g1", "g2"]);
  assert.equal(body.days[1].groupStates[0].status, "NO_LESSONS");
  assert.equal(JSON.stringify(body).includes("secret-pdf-key"), false);
  assert.equal(JSON.stringify(body).includes("private import text"), false);
  assert.equal(response.headers.get("vary"), "Cookie");
  assert.deepEqual(ctx.calls[0][1].select, { id: true });
  const query = ctx.calls[1][1];
  assert.equal(query.where.kind, "GLOBAL");
  assert.equal(query.where.status, "PUBLISHED");
  assert.equal(query.where.course, 3);
  assert.equal(
    query.where.validFrom.lte.toISOString(),
    "2026-09-20T00:00:00.000Z",
  );
  assert.equal(
    query.where.validTo.gte.toISOString(),
    "2026-09-14T00:00:00.000Z",
  );
  assert.equal(
    query.include.lessons.include.audiences.include.group.select.name,
    true,
  );
});

test("group columns come from all lesson audiences, while a shared lesson stays one record", async () => {
  const timetable = schedule();
  timetable.lessons[0].audiences.push({
    groupId: "g1",
    subgroupId: "subgroup-1",
    group: { id: "g1", name: "TI-241" },
  });
  timetable.lessons.push({
    ...timetable.lessons[0],
    id: "tuesday-only",
    weekday: 1,
    audiences: [
      {
        groupId: "g3",
        subgroupId: null,
        group: { id: "g3", name: "TI-243" },
      },
    ],
  });
  const response = await setup({ schedules: [timetable] }).request(
    "course=3&from=2026-09-14&to=2026-09-14",
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(
    body.groups.map((group) => group.id),
    ["g1", "g2", "g3"],
  );
  assert.deepEqual(
    body.days[0].groupStates.map((state) => state.status),
    ["LESSONS", "LESSONS", "NO_LESSONS"],
  );
  assert.equal(body.days[0].lessons.length, 1);
  assert.deepEqual(body.days[0].lessons[0].groupIds, ["g1", "g2"]);
});

test("API distinguishes unpublished dates, holidays and published days without lessons", async () => {
  const timetable = schedule();
  timetable.validFrom = date("2026-09-15");
  timetable.holidays = [
    {
      id: "holiday",
      name: "Выходной",
      startsOn: date("2026-09-16"),
      endsOn: date("2026-09-16"),
    },
  ];
  const response = await setup({ schedules: [timetable] }).request(
    "course=3&from=2026-09-14&to=2026-09-17",
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(
    body.days.map((day) => day.groupStates[0].status),
    ["NOT_PUBLISHED", "NO_LESSONS", "HOLIDAY", "NO_LESSONS"],
  );
  assert.equal(body.days[0].groupStates[0].scheduleId, null);
  assert.equal(body.days[2].groupStates[0].holidays[0].name, "Выходной");
  assert.ok(body.days.every((day) => day.lessons.length === 0));
});

test("empty result, conflicts and internal failures have distinct safe responses", async () => {
  const empty = await setup().request();
  assert.equal(empty.status, 200);
  const emptyBody = await empty.json();
  assert.deepEqual(emptyBody.groups, []);
  assert.equal(emptyBody.days.length, 7);
  assert.ok(
    emptyBody.days.every(
      (day) => !day.groupStates.length && !day.lessons.length,
    ),
  );
  const second = schedule();
  second.id = "second";
  const conflict = await setup({ schedules: [schedule(), second] }).request();
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).code, "SCHEDULE_CONFLICT");
  const failed = await setup({ failure: true }).request();
  assert.equal(failed.status, 500);
  assert.equal((await failed.text()).includes("SECRET_DATABASE_URL"), false);
});
