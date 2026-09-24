import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import pg from "pg";

test("PDF catalog repair restores only verified import fragments and protects edits", async () => {
  assert.equal(
    process.env.ALLOW_DB_TESTS,
    "1",
    "Use an isolated test database",
  );
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    // Shadow real tables: this test never changes persisted application rows.
    for (const table of [
      "Subject",
      "ScheduleImport",
      "Lesson",
      "LessonAudience",
      "StudyGroup",
    ]) {
      await db.query(
        `CREATE TEMP TABLE "${table}" (LIKE public."${table}" INCLUDING ALL)`,
      );
    }
    await db.query(`
      INSERT INTO "Subject" (id,name) VALUES ('teacher','Cantir L.'),('orphan','Braga M.'),
        ('edited','Bumbu T.'),('linked','Buza D.'),('alias','CI 2 A03 Magariu N.');
      UPDATE "Subject" SET "ectsCredits"=5 WHERE id='edited';
      INSERT INTO "StudyGroup" (id,name) VALUES ('group','SI-267'),('other-group','SI-268');
      INSERT INTO "ScheduleImport" (id,"semesterId",course,title,"validFrom","validTo","updatedAt","sourceFileKey")
      VALUES ('schedule','unused',1,'PDF','2026-09-01','2026-12-31','2026-09-01','fixture.pdf');
    `);
    const variants = [
      "original",
      "reviewed",
      "mapped",
      "different-source",
      "different-group",
      "edited-time",
      "edited-teacher",
      "linked",
    ];
    for (const id of variants) {
      await db.query(
        `INSERT INTO "Lesson" (id,"scheduleId","subjectId",weekday,"startMinutes","endMinutes","weekPattern","sourceText",reviewed,"sourceSubjectName",teacher)
        VALUES ($1,'schedule',$2,4,$3,900,'EVEN',$4,$5,$6,$7)`,
        [
          id,
          id === "linked" ? "linked" : "teacher",
          id === "edited-time" ? 800 : 810,
          id === "different-source"
            ? "Manual source"
            : "Страница 1\n624\nCantir L.",
          id === "reviewed",
          id === "mapped" ? "User choice" : null,
          id === "edited-teacher" ? "Manual teacher" : null,
        ],
      );
      await db.query(
        `INSERT INTO "LessonAudience" (id,"lessonId","groupId") VALUES ($1,$1,$2)`,
        [id, id === "different-group" ? "other-group" : "group"],
      );
    }
    const lessons = async () =>
      (await db.query('SELECT * FROM "Lesson" ORDER BY id')).rows;
    const before = await lessons();
    const audiences = (
      await db.query('SELECT * FROM "LessonAudience" ORDER BY id')
    ).rows;
    const sql = await readFile(
      new URL(
        "../../prisma/migrations/20260924130000_repair_pdf_subject_catalog/migration.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.query(sql);
    const after = await lessons();
    assert.deepEqual(
      after.filter((l) => l.id !== "original"),
      before.filter((l) => l.id !== "original"),
    );
    const fixed = after.find((l) => l.id === "original");
    assert.equal(fixed.teacher, "Cantir L.");
    assert.equal(fixed.classroom, "624");
    assert.equal(fixed.weekPattern, "EVERY");
    assert.equal(fixed.sourceSubjectName, "L. Română");
    assert.equal(
      (
        await db.query('SELECT name FROM "Subject" WHERE id=$1', [
          fixed.subjectId,
        ])
      ).rows[0].name,
      "L. Română",
    );
    assert.deepEqual(
      (await db.query('SELECT * FROM "LessonAudience" ORDER BY id')).rows,
      audiences,
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM \"Subject\" WHERE id='orphan'",
        )
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await db.query(
          'SELECT "ectsCredits" FROM "Subject" WHERE id=\'edited\'',
        )
      ).rows[0].ectsCredits,
      "5.0",
    );
    assert.equal(
      (await db.query("SELECT name FROM \"Subject\" WHERE id='alias'")).rows[0]
        .name,
      "CI 2",
    );
    await db.query(sql);
    assert.deepEqual(await lessons(), after);
  } finally {
    await db.end();
  }
});
