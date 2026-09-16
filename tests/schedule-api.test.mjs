import assert from "node:assert/strict";
import test from "node:test";
import { tsImport } from "tsx/esm/api";
const { createScheduleGet } = await tsImport(
  "../lib/server/schedule-api.ts",
  import.meta.url,
);

const date = (s) => new Date(`${s}T00:00:00Z`);
const profile = {
  groupId: "current",
  group: "TI-245",
  studyGroup: { id: "current", name: "TI-245" },
  subgroup: null,
};
function setup({
  session = { user: { id: "student", group: "STALE-GROUP" } },
  user = profile,
  schedules = [],
  failure = false,
} = {}) {
  const calls = [];
  const handler = createScheduleGet({
    authenticate: async () => session,
    db: {
      user: {
        findUnique: async (query) => {
          calls.push(["user", query]);
          if (failure) throw new Error("SECRET_DATABASE_URL");
          return user;
        },
      },
      studyGroup: {
        findUnique: async (query) => {
          calls.push(["studyGroup", query]);
          return query.where.name === "TI-245"
            ? { id: "current", name: "TI-245" }
            : null;
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
    request: (query = "from=2026-09-14&to=2026-09-15") =>
      handler(new Request(`http://localhost/api/schedule?${query}`)),
  };
}
function schedule() {
  return {
    id: "timetable",
    status: "PUBLISHED",
    sourceFileKey: "private-file",
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
    holidays: [
      {
        id: "holiday",
        name: "Выходной",
        startsOn: date("2026-09-15"),
        endsOn: date("2026-09-15"),
      },
    ],
    lessons: [
      {
        id: "lesson",
        weekday: 0,
        startMinutes: 1125,
        endMinutes: 1215,
        weekPattern: "ODD",
        type: "LECTURE",
        teacher: "Teacher",
        classroom: "611",
        topic: null,
        subject: { id: "subject", name: "Math", colorKey: "blue" },
        audiences: [{ groupId: "current", subgroupId: null }],
      },
    ],
  };
}

test("schedule API requires authentication and never queries DB for anonymous visitors", async () => {
  for (const session of [null, { user: {} }]) {
    const ctx = setup({ session });
    const response = await ctx.request();
    assert.equal(response.status, 401);
    assert.equal(ctx.calls.length, 0);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
});

test("schedule API rejects invalid, duplicate and forged parameters before querying DB", async () => {
  for (const query of [
    "",
    "from=2026-09-14",
    "from=2026-02-30&to=2026-03-01",
    "from=2026-09-15&to=2026-09-14",
    "from=2026-01-01&to=2027-01-02",
    "from=2026-09-14&to=2026-09-15&from=2026-09-16",
    "from=2026-09-14&to=2026-09-15&groupId=other",
    "from=2026-09-14&to=2026-09-15&userId=other",
  ]) {
    const ctx = setup();
    const response = await ctx.request(query);
    assert.equal(response.status, 400, query);
    assert.equal(ctx.calls.length, 0);
  }
});

test("deleted users return 401 and only a missing group requires profile completion", async () => {
  assert.equal((await setup({ user: null }).request()).status, 401);
  for (const user of [{ groupId: null, studyGroup: null }]) {
    const ctx = setup({ user });
    const response = await ctx.request();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "PROFILE_REQUIRED");
    assert.equal(ctx.calls.length, 1);
  }
  assert.equal(
    (
      await setup({ user: profile })
        .request()
        .then((r) => r.json())
    ).status,
    "READY",
  );
  const legacy = setup({
    user: { groupId: null, group: "TI-245", studyGroup: null },
    schedules: [schedule()],
  });
  assert.equal((await legacy.request().then((r) => r.json())).status, "READY");
  assert.equal(legacy.calls[1][0], "studyGroup");
});

test("API uses current database membership, limits query and returns calculated days without private fields", async () => {
  const ctx = setup({ schedules: [schedule()] });
  const response = await ctx.request();
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.timeZone, "Europe/Chisinau");
  assert.deepEqual(
    body.days.map((d) => d.status),
    ["LESSONS", "HOLIDAY"],
  );
  assert.equal(body.days[0].lessons[0].endMinutes, 1215);
  assert.equal(body.days[0].week.parity, "ODD");
  assert.equal(JSON.stringify(body).includes("private-file"), false);
  assert.equal(JSON.stringify(body).includes("reviewed"), false);
  assert.equal(JSON.stringify(body).includes("sourceText"), false);
  assert.equal(JSON.stringify(body).includes("warnings"), false);
  assert.deepEqual(ctx.calls[0][1].where, { id: "student" });
  assert.equal(ctx.calls[0][1].select.password, undefined);
  const query = ctx.calls[1][1];
  assert.equal(query.where.status, "PUBLISHED");
  assert.equal(query.where.kind, "STUDENT");
  assert.equal(query.where.lessons.some.audiences.some.groupId, "current");
  assert.equal(
    query.where.validFrom.lte.toISOString(),
    "2026-09-15T00:00:00.000Z",
  );
  assert.equal(
    query.where.validTo.gte.toISOString(),
    "2026-09-14T00:00:00.000Z",
  );
  assert.deepEqual(query.include.lessons.where, {
    audiences: { some: { groupId: "current" } },
  });
  assert.equal(response.headers.get("vary"), "Cookie");
});

test("empty publication result is distinguished from server error and conflicting publications", async () => {
  const empty = await setup().request();
  assert.ok(
    (await empty.json()).days.every((d) => d.status === "NOT_PUBLISHED"),
  );
  const a = schedule(),
    b = { ...schedule(), id: "second" };
  const conflict = await setup({ schedules: [a, b] }).request();
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).code, "SCHEDULE_CONFLICT");
  const failed = await setup({ failure: true }).request();
  assert.equal(failed.status, 500);
  assert.equal((await failed.text()).includes("SECRET_DATABASE_URL"), false);
  const badData = schedule();
  badData.semester.academicYear.firstOddWeekMonday = date("2026-09-01");
  assert.equal(
    (await setup({ schedules: [badData] }).request()).status,
    500,
    "stored-data errors must not be blamed on the user's dates",
  );
});
