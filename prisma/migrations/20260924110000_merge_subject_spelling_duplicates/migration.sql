BEGIN;
-- Keep all lessons and audiences. Only merge records with identical metadata.
LOCK TABLE "Subject", "Lesson" IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE subject_merge ON COMMIT DROP AS
WITH named AS (
  SELECT s.*, regexp_replace(btrim(s.name), '\s+', ' ', 'g') AS clean,
    (SELECT count(*) FROM "Lesson" l WHERE l."subjectId" = s.id) AS uses
  FROM "Subject" s
), keyed AS (
  SELECT *, CASE
    -- Reviewed OCR artifacts from this catalog, not general fuzzy matching.
    WHEN clean = 'Algebra liniară și geometria analică' THEN 'algebra liniara si geometria analitica'
    WHEN clean IN ('APA Munteanu M. 110', 'APA Munteanu M. D-01-03',
                   'APA Perevoznic V. 110', 'APA Perevoznic V. D-02-04') THEN 'apa'
    WHEN clean ~ '^[A-ZĂÂÎȘȚŞŢ]{1,4}$' THEN lower(clean)
    ELSE lower(translate(clean, 'ăâîșțşţĂÂÎȘȚŞŢ', 'aaiststAAISTST'))
  END AS key
  FROM named
), eligible AS (
  SELECT key FROM keyed GROUP BY key
  HAVING count(*) > 1
     AND count(DISTINCT jsonb_build_array(code,faculty,"ectsCredits",status,"colorKey")) = 1
), ranked AS (
  SELECT id, first_value(id) OVER (PARTITION BY key ORDER BY
    CASE WHEN clean = 'Algebra liniară și geometria analică' OR clean LIKE 'APA %' THEN 1 ELSE 0 END,
    uses DESC, id) AS keep_id
  FROM keyed JOIN eligible USING (key)
)
SELECT id, keep_id FROM ranked WHERE id <> keep_id;

UPDATE "Lesson" l SET "subjectId" = m.keep_id FROM subject_merge m WHERE l."subjectId" = m.id;
DELETE FROM "Subject" s USING subject_merge m WHERE s.id = m.id;
COMMIT;
