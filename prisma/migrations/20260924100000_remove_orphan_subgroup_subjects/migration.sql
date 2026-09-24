-- Historical parser artifacts. Never remove linked or manually enriched subjects.
DELETE FROM "Subject" AS s
WHERE s.name IN (
  '0,5 gr. 1) CDE Chiriac M. A03 2) MS Litra D.',
  '0,5 gr. AFU Brînză M.',
  'PADM 0,5 gr.'
)
AND s.code IS NULL AND s.faculty IS NULL AND s."ectsCredits" IS NULL
AND s.status = 'ACTIVE' AND s."colorKey" = 'blue'
AND NOT EXISTS (SELECT 1 FROM "Lesson" AS l WHERE l."subjectId" = s.id);
