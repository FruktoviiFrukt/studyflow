BEGIN;
LOCK TABLE "Subject", "Lesson" IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE subject_detail_cleanup (old_name text, new_name text) ON COMMIT DROP;
INSERT INTO subject_detail_cleanup VALUES
 ('Analiza și Specif. Software Plămădeală C', 'Analiza și Specif. Software'),
 ('ASCS Plămădeală C', 'ASCS'),
 ('Baze de date 1 Saranciuc D. 3-3 Amdaris', 'Baze de date 1'),
 ('BD (noiembrie / decembrie) Saranciuc D.', 'BD (noiembrie / decembrie)'),
 ('BD (octombrie / noiembrie) Saranciuc D.', 'BD (octombrie / noiembrie)'),
 ('Aula 6-2 Henri Coandă', NULL);

-- Only historical orphan artifacts without administrator-supplied metadata.
DELETE FROM "Subject" s USING subject_detail_cleanup m
WHERE s.name = m.old_name
 AND s.code IS NULL AND s.faculty IS NULL AND s."ectsCredits" IS NULL
 AND s.status = 'ACTIVE' AND s."colorKey" = 'blue'
 AND NOT EXISTS (SELECT 1 FROM "Lesson" l WHERE l."subjectId" = s.id)
 AND (m.new_name IS NULL OR EXISTS (
   SELECT 1 FROM "Subject" target WHERE lower(target.name) = lower(m.new_name) AND target.id <> s.id
 ));

-- If the clean subject is absent, keep the record and correct only its name.
UPDATE "Subject" s SET name = m.new_name FROM subject_detail_cleanup m
WHERE s.name = m.old_name AND m.new_name IS NOT NULL
 AND s.code IS NULL AND s.faculty IS NULL AND s."ectsCredits" IS NULL
 AND s.status = 'ACTIVE' AND s."colorKey" = 'blue'
 AND NOT EXISTS (SELECT 1 FROM "Lesson" l WHERE l."subjectId" = s.id)
 AND NOT EXISTS (SELECT 1 FROM "Subject" target WHERE lower(target.name) = lower(m.new_name));
COMMIT;
