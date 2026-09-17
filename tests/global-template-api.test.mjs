import assert from "node:assert/strict";
import test from "node:test";
import { createGlobalTemplateGet } from "../lib/server/global-template-api.ts";

test("template API requires login, validates course and semester, and reads published GLOBAL", async () => {
  const calls = [];
  const handler = createGlobalTemplateGet({
    authenticate: async () => ({ user: { id: "user" } }),
    db: {
      user: { findUnique: async () => ({ id: "user" }) },
      scheduleImport: {
        findMany: async (query) => {
          calls.push(query);
          return [];
        },
      },
    },
  });
  const invalid = await handler(
    new Request(
      "http://localhost/api/schedule/global/template?course=3&semester=1&from=2026-09-14",
    ),
  );
  assert.equal(invalid.status, 400);
  assert.equal(calls.length, 0);
  const response = await handler(
    new Request(
      "http://localhost/api/schedule/global/template?course=3&semester=1",
    ),
  );
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).groups, []);
  assert.deepEqual(calls[0].where, {
    kind: "GLOBAL",
    status: "PUBLISHED",
    course: 3,
    semester: { number: 1 },
  });
  assert.equal(
    (
      await handler(
        new Request(
          "http://localhost/api/schedule/global/template?course=3&semester=3",
        ),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handler(
        new Request(
          "http://localhost/api/schedule/global/template?course=3&course=2&semester=1",
        ),
      )
    ).status,
    400,
  );
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const anonymous = createGlobalTemplateGet({
    authenticate: async () => null,
    db: {
      user: {
        findUnique: async () => {
          throw new Error("DB should not be read");
        },
      },
    },
  });
  assert.equal(
    (
      await anonymous(
        new Request(
          "http://localhost/api/schedule/global/template?course=3&semester=1",
        ),
      )
    ).status,
    401,
  );
});
