BEGIN;
SELECT pg_advisory_xact_lock(735026151);
LOCK TABLE "Subject", "ScheduleImport", "Lesson" IN SHARE ROW EXCLUSIVE MODE;

-- Match the catalog/import key: ignore case and whitespace, retain numbers
-- and punctuation. Short abbreviations retain their accents (IS <> ÎS).
-- Conflicting administrator metadata requires a manual decision.
CREATE TEMP TABLE subject_spacing_merge ON COMMIT DROP AS
WITH compact AS (
 SELECT s.*, regexp_replace(normalize(s.name, NFC), '[\s ﻿]+', '', 'g') AS compact_name,
   (SELECT count(*) FROM "Lesson" l WHERE l."subjectId" = s.id) AS uses
 FROM "Subject" s
), keyed AS (
 SELECT *, CASE WHEN compact_name ~ '^[A-Za-zĂÂÎȘȚŞŢăâîșțşţ]{1,4}[0-9]*$'
   THEN lower(compact_name)
   ELSE lower(translate(compact_name, 'ăâîșțşţĂÂÎȘȚŞŢ', 'aaiststAAISTST'))
   END AS key
 FROM compact
), eligible AS (
 SELECT key FROM keyed GROUP BY key HAVING count(*) > 1
 AND count(DISTINCT jsonb_build_array(code,faculty,"ectsCredits",status,"colorKey")) = 1
), ranked AS (
 SELECT id, first_value(id) OVER (PARTITION BY key ORDER BY uses DESC, id) AS keep_id
 FROM keyed JOIN eligible USING (key)
)
SELECT id, keep_id FROM ranked WHERE id <> keep_id;

UPDATE "ScheduleImport" SET "updatedAt" = CURRENT_TIMESTAMP WHERE id IN (
 SELECT l."scheduleId" FROM "Lesson" l JOIN subject_spacing_merge m ON m.id = l."subjectId"
);
UPDATE "Lesson" l SET "subjectId" = m.keep_id FROM subject_spacing_merge m WHERE l."subjectId" = m.id;
DELETE FROM "Subject" s USING subject_spacing_merge m WHERE s.id = m.id;
COMMIT;
