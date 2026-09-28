import assert from "node:assert/strict";
import test from "node:test";
import { tsImport } from "tsx/esm/api";
const { createSubjectCatalogApi } = await tsImport(
  "../lib/server/subject-catalog-api.ts",
  import.meta.url,
);

function setup({
  session = { user: { id: "admin" } },
  role = "ADMIN",
  existing = { id: "subject" },
  duplicate = null,
  failure = null,
  normalizedDuplicate = null,
} = {}) {
  const writes = [];
  let reads = 0;
  const record = {
    id: "subject",
    name: "Algebra",
    code: null,
    faculty: null,
    status: "ACTIVE",
    lessons: [],
  };
  const api = createSubjectCatalogApi({
    authenticate: async () => session,
    db: {
      user: { findUnique: async () => (role ? { role } : null) },
      subject: {
        delete: async (args) => {
          if (failure) throw failure;
          writes.push(args);
          return { id: "subject" };
        },
        findMany: async (args) => {
          reads++;
          if (!args.select.lessons)
            return normalizedDuplicate
              ? [{ id: "other", name: normalizedDuplicate }]
              : [];
          return [record];
        },
        findFirst: async () => duplicate,
        findUnique: async () => existing,
        create: async (args) => {
          if (failure) throw failure;
          writes.push(args);
          return { ...record, ...args.data };
        },
        update: async (args) => {
          if (failure) throw failure;
          writes.push(args);
          return { ...record, ...args.data };
        },
      },
    },
  });
  const request = (method, body, headers = {}) =>
    new Request("http://localhost/api/admin/subjects", {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
    });
  return { api, writes, readCount: () => reads, request };
}

test("every catalog operation requires an authenticated current administrator", async () => {
  for (const [options, status] of [
    [{ session: null }, 401],
    [{ role: "STUDENT" }, 403],
    [{ role: null }, 403],
  ]) {
    const s = setup(options);
    assert.equal((await s.api.GET(s.request("GET"))).status, status);
    assert.equal(
      (await s.api.DETAIL(s.request("GET"), "subject")).status,
      status,
    );
    assert.equal(
      (await s.api.POST(s.request("POST", { name: "Test" }))).status,
      status,
    );
    assert.equal(
      (await s.api.PATCH(s.request("PATCH", { status: "ARCHIVED" }), "subject"))
        .status,
      status,
    );
    assert.equal(s.writes.length, 0);
    assert.equal(s.readCount(), 0);
  }
});
test("delete is admin-only, respects references and reports missing subjects", async () => {
  for (const [options, status] of [
    [{ session: null }, 401],
    [{ role: "STUDENT" }, 403],
    [{ failure: { code: "P2003" } }, 409],
    [{ failure: { code: "P2025" } }, 404],
  ]) {
    const s = setup(options);
    assert.equal(
      (await s.api.DELETE(s.request("DELETE"), "subject")).status,
      status,
    );
    assert.equal(s.writes.length, 0);
  }
  const s = setup();
  assert.equal(
    (
      await s.api.DELETE(
        s.request("DELETE", undefined, { Origin: "https://other.test" }),
        "subject",
      )
    ).status,
    403,
  );
  const result = await s.api.DELETE(s.request("DELETE"), "subject");
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { deleted: true });
  assert.deepEqual(s.writes, [
    { where: { id: "subject" }, select: { id: true } },
  ]);
});
test("catalog returns real records with private no-store caching", async () => {
  const s = setup();
  const response = await s.api.GET(s.request("GET"));
  assert.equal(response.status, 200);
  assert.equal((await response.json())[0].name, "Algebra");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});
test("catalog rejects spelling-only duplicates on create and rename", async () => {
  const s = setup({ normalizedDuplicate: "Analiza matematică 1" });
  for (const method of ["POST", "PATCH"]) {
    const r = await s.api[method](
      s.request(method, { name: "  ANALIZA   MATEMATICA 1 " }),
      "subject",
    );
    assert.equal(r.status, 409);
    assert.equal((await r.json()).field, "name");
  }
  assert.equal(s.writes.length, 0);
});
test("create trims fields, normalizes code/faculty and supports missing metadata", async () => {
  const s = setup();
  let response = await s.api.POST(
    s.request("POST", {
      name: "  Algebra  ",
      code: " ab-1 ",
      faculty: " fcim ",
    }),
  );
  assert.equal(response.status, 201);
  assert.equal((await response.json()).code, "AB-1");
  assert.deepEqual(s.writes[0].data, {
    name: "Algebra",
    code: "AB-1",
    faculty: "FCIM",
  });
  response = await s.api.POST(
    s.request("POST", { name: "Other", code: "  ", faculty: null }),
  );
  assert.equal(response.status, 201);
  assert.equal((await response.json()).code, null);
  response = await s.api.POST(s.request("POST", { name: "Name only" }));
  assert.equal(response.status, 201);
});
test("invalid bodies and attempts to write unrelated fields never mutate", async () => {
  for (const body of [
    null,
    [],
    {},
    { name: " " },
    { name: null },
    { name: 17 },
    { name: "x".repeat(161) },
    { name: "Test", code: 42 },
    { name: "Test", faculty: "x".repeat(81) },
    { name: "Test", lessons: [] },
    { name: "Test", status: "ARCHIVED" },
  ]) {
    const s = setup();
    assert.equal((await s.api.POST(s.request("POST", body))).status, 400);
    assert.equal(s.writes.length, 0);
  }
  const s = setup();
  assert.equal(
    (
      await s.api.POST(
        new Request("http://localhost/api/admin/subjects", {
          method: "POST",
          body: "{",
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await s.api.POST(
        new Request("http://localhost/api/admin/subjects", {
          method: "POST",
          body: "x".repeat(16001),
        }),
      )
    ).status,
    413,
  );
  assert.equal(
    (await s.api.PATCH(s.request("PATCH", { status: "WRONG" }), "subject"))
      .status,
    400,
  );
  assert.equal(
    (await s.api.PATCH(s.request("PATCH", {}), "subject")).status,
    400,
  );
});
test("duplicate fields and database uniqueness conflicts return 409", async () => {
  for (const [duplicate, body, field] of [
    [{ name: "Algebra", code: null }, { name: "algebra" }, "name"],
    [{ name: "Other", code: "AB-1" }, { name: "New", code: "ab-1" }, "code"],
  ]) {
    const s = setup({ duplicate });
    const response = await s.api.POST(s.request("POST", body));
    assert.equal(response.status, 409);
    assert.equal((await response.json()).field, field);
    assert.equal(s.writes.length, 0);
  }
  const s = setup({ failure: { code: "P2002" } });
  assert.equal(
    (await s.api.POST(s.request("POST", { name: "New" }))).status,
    409,
  );
});
test("archive updates status only; edit can explicitly clear optional fields", async () => {
  const s = setup();
  assert.equal(
    (await s.api.PATCH(s.request("PATCH", { status: "ARCHIVED" }), "subject"))
      .status,
    200,
  );
  assert.deepEqual(s.writes[0].data, { status: "ARCHIVED" });
  await s.api.PATCH(s.request("PATCH", { code: null, faculty: "" }), "subject");
  assert.deepEqual(s.writes[1].data, { code: null, faculty: null });
});
test("missing subjects return 404 and foreign origins cannot mutate", async () => {
  const s = setup({ existing: null });
  assert.equal(
    (await s.api.PATCH(s.request("PATCH", { name: "New" }), "missing")).status,
    404,
  );
  assert.equal(
    (
      await s.api.POST(
        s.request("POST", { name: "New" }, { origin: "https://other.example" }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await s.api.PATCH(
        s.request(
          "PATCH",
          { status: "ACTIVE" },
          { origin: "https://other.example" },
        ),
        "subject",
      )
    ).status,
    403,
  );
  assert.equal(s.writes.length, 0);
});

test("ECTS credits accept optional decimal values and reject invalid input", async () => {
  for (const ectsCredits of [null, 0.1, 4.5, 8.3, 60]) {
    const s = setup();
    const response = await s.api.POST(
      s.request("POST", { name: "New", ectsCredits }),
    );
    assert.equal(response.status, 201);
    assert.equal((await response.json()).ectsCredits, ectsCredits);
    const update = await s.api.PATCH(
      s.request("PATCH", { ectsCredits }),
      "subject",
    );
    assert.equal(update.status, 200);
  }
  for (const ectsCredits of [0, -1, 60.1, 4.55, "4.5", "", false, {}, []]) {
    const s = setup();
    const response = await s.api.PATCH(
      s.request("PATCH", { ectsCredits }),
      "subject",
    );
    assert.equal(response.status, 400);
    assert.equal((await response.json()).field, "ectsCredits");
    assert.equal(s.writes.length, 0);
  }
  const s = setup();
  assert.equal(
    (await (await s.api.POST(s.request("POST", { name: "Unset" }))).json())
      .ectsCredits,
    null,
  );
});
