import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEmail } from "../lib/email.ts";

test("email is trimmed and lowercased for storage and lookup", () => {
  assert.equal(normalizeEmail("  Ivan.Petrov@UTM.md "), "ivan.petrov@utm.md");
  assert.equal(normalizeEmail("a@b.md"), "a@b.md");
});
