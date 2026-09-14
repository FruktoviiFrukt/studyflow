import assert from "node:assert/strict";
import test from "node:test";
import { validateTask, TASK_TYPES } from "../lib/tasks.ts";

const subjects = ["Программирование"];
const valid = {
  title: "Лабораторная",
  subject: subjects[0],
  type: "Лабораторная",
  priority: "medium",
  status: "todo",
  dueDate: "2026-09-10",
  notes: "",
};

test("task validation accepts all statuses, optional descriptions and overdue deadlines", () => {
  for (const status of ["todo", "in_progress", "done"]) {
    assert.deepEqual(
      validateTask(
        { ...valid, status, dueDate: "2020-01-01", notes: undefined },
        subjects,
      ),
      {},
    );
  }
});

test("blank titles and missing or invalid selections are rejected", () => {
  const errors = validateTask(
    {
      ...valid,
      title: "   ",
      subject: "",
      type: "",
      priority: "invalid",
      status: "invalid",
    },
    subjects,
  );
  assert.deepEqual(Object.keys(errors).sort(), [
    "priority",
    "status",
    "subject",
    "title",
    "type",
  ]);
});

test("calendar validation rejects missing dates, rollover dates and invalid leap days", () => {
  for (const dueDate of [
    "",
    "invalid",
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "0000-01-01",
  ]) {
    assert.ok(validateTask({ ...valid, dueDate }, subjects).dueDate, dueDate);
  }
  assert.deepEqual(
    validateTask({ ...valid, dueDate: "2028-02-29" }, subjects),
    {},
  );
});

test("validation enforces text limits and preserves an existing custom task type", () => {
  assert.ok(validateTask({ ...valid, title: "a".repeat(161) }, subjects).title);
  assert.ok(
    validateTask({ ...valid, notes: "a".repeat(2001) }, subjects).notes,
  );
  assert.deepEqual(
    validateTask(
      { ...valid, title: "a".repeat(160), notes: "a".repeat(2000) },
      subjects,
    ),
    {},
  );
  assert.deepEqual(
    validateTask({ ...valid, type: "Старый тип" }, subjects, [
      ...TASK_TYPES,
      "Старый тип",
    ]),
    {},
  );
});
