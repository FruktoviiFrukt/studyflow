import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import pg from "pg";

test("spacing merge retains lessons, source spelling and conflicting metadata", async () => {
  assert.equal(process.env.ALLOW_DB_TESTS, "1");
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    for (const table of ["Subject", "Lesson", "ScheduleImport"]) {
      await db.query(
        `CREATE TEMP TABLE "${table}" (LIKE public."${table}" INCLUDING ALL)`,
      );
    }
    await db.query(`INSERT INTO "Subject" (id,name) VALUES
      ('a','BD 1'),('b','bd1'),('c','BD2'),('d','IS'),('e','ÎS'),('f','îs'),
      ('g','Etică și Securitate Umană'),('h','Eticași securitateumană'),
      ('i','Manual course'),('j','Manualcourse');
      UPDATE "Subject" SET "ectsCredits"=4 WHERE id='i';
      INSERT INTO "Lesson" (id,"scheduleId","subjectId",weekday,"startMinutes","endMinutes","sourceSubjectName")
      VALUES ('one','unused','a',1,480,570,'BD 1'),('two','unused','b',2,480,570,'bd1');`);
    const sql = await readFile(
      new URL(
        "../../prisma/migrations/20260924140000_merge_subject_spacing_variants/migration.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.query(sql);
    const subjects = (
      await db.query('SELECT id,name FROM "Subject" ORDER BY id')
    ).rows;
    assert.deepEqual(
      subjects.map((s) => s.id),
      ["a", "c", "d", "e", "g", "i", "j"],
    );
    const lessons = (
      await db.query(
        'SELECT id,"subjectId","sourceSubjectName",weekday FROM "Lesson" ORDER BY id',
      )
    ).rows;
    assert.deepEqual(lessons, [
      { id: "one", subjectId: "a", sourceSubjectName: "BD 1", weekday: 1 },
      { id: "two", subjectId: "a", sourceSubjectName: "bd1", weekday: 2 },
    ]);
    await db.query(sql);
    assert.deepEqual(
      (await db.query('SELECT id,name FROM "Subject" ORDER BY id')).rows,
      subjects,
    );
  } finally {
    await db.end();
  }
});
