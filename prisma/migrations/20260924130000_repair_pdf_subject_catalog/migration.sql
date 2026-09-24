-- Historical import repair, verified against the original PDF cells.
-- New uploads are fixed by the parser. Exact source, slot, group and metadata
-- guards keep reviewed lessons, manual mappings and unrelated records intact.
BEGIN;
SELECT pg_advisory_xact_lock(735026151);
LOCK TABLE "Subject", "ScheduleImport", "Lesson", "LessonAudience" IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE pdf_subject_repairs (
 old_name text, new_name text, old_source text, new_source text,
 day integer, start_min integer, end_min integer, groups text,
 old_teacher text, old_room text, old_week text,
 teacher text, room text, week text
) ON COMMIT DROP;
INSERT INTO pdf_subject_repairs VALUES
 (E'C. Tehnici d eprogramare', E'Tehnici d eprogramare', E'Страница 1\nC. Tehnici d eprogramare\nRoșca N.\n6-2', E'Страница 1\nC. Tehnici d eprogramare\nRoșca N.\n6-2', 3, 1125, 1215, E'AI-261,AI-264,CR-261,CR-262,EA-261,IBM-261,MN-261,R-261,R-263', E'Roșca N.', E'6-2', E'EVERY', E'Roșca N.', E'6-2', E'EVERY'),
 (E'Cantir L.', E'L. Română', E'Страница 1\n107\nCantir L.', E'Страница 1\nL. Română\n107\nCantir L.', 4, 915, 1005, E'SI-269', NULL, NULL, E'EVEN', E'Cantir L.', E'107', E'EVERY'),
 (E'Cantir L.', E'L. Română', E'Страница 1\n624\nCantir L.', E'Страница 1\nL. Română\n624\nCantir L.', 4, 810, 900, E'SI-267', NULL, NULL, E'EVEN', E'Cantir L.', E'624', E'EVERY'),
 (E'Dutova L.', E'L. Engleză', E'Страница 1\n107/512\nDutova L.', E'Страница 1\nL. Engleză\n107/512\nDutova L.', 0, 585, 675, E'TI-261', NULL, NULL, E'EVEN', E'Dutova L.', E'107/512', E'EVERY'),
 (E'Dutova L.', E'L. Engleză', E'Страница 1\n107/611\nDutova L.', E'Страница 1\nL. Engleză\n107/611\nDutova L.', 1, 690, 780, E'SI-267', NULL, NULL, E'EVEN', E'Dutova L.', E'107/611', E'EVERY'),
 (E'Dutova L.', E'L. Engleză', E'Страница 1\n312/203\nDutova L.', E'Страница 1\nL. Engleză\n312/203\nDutova L.', 2, 585, 675, E'SI-263', NULL, NULL, E'EVEN', E'Dutova L.', E'312/203', E'EVERY'),
 (E'ESU P. Russu', E'ESU', E'Страница 1\nESU\nP. Russu\n401', E'Страница 1\nESU\nP. Russu\n401', 1, 810, 900, E'IA-261,IA-262', NULL, E'401', E'EVERY', E'P. Russu', E'401', E'EVERY'),
 (E'ESU P. Russu', E'ESU', E'Страница 1\nESU\nP. Russu\n614', E'Страница 1\nESU\nP. Russu\n614', 3, 690, 780, E'IA-261,IA-262', NULL, E'614', E'EVERY', E'P. Russu', E'614', E'EVERY'),
 (E'Ed. Fizică Sala sportivă', E'Ed. Fizică', E'Страница 1\nEd. Fizică\nSala sportivă', E'Страница 1\nEd. Fizică\nSala sportivă', 2, 810, 900, E'AI-261,R-261', NULL, NULL, E'EVEN', E'', E'Sala sportivă', E'EVEN'),
 (E'Ed. Fizică Sala sportivă', E'Ed. Fizică', E'Страница 1\nEd. Fizică\nSala sportivă', E'Страница 1\nEd. Fizică\nSala sportivă', 3, 810, 900, E'SI-269', NULL, NULL, E'ODD', E'', E'Sala sportivă', E'ODD'),
 (E'Ed. Fizică Sala sportivă', E'Ed. Fizică', E'Страница 1\nEd. fizică\nSala sportivă', E'Страница 1\nEd. fizică\nSala sportivă', 3, 585, 675, E'SD-261', NULL, NULL, E'ODD', E'', E'Sala sportivă', E'ODD'),
 (E'Ed. Fizică Sala sportivă', E'Ed. Fizică', E'Страница 1\nEd. fizică\nSala sportivă', E'Страница 1\nEd. fizică\nSala sportivă', 3, 690, 780, E'AI-262,AI-263,R-264', NULL, NULL, E'ODD', E'', E'Sala sportivă', E'ODD'),
 (E'Educația fizică Sala sportivă', E'Educația fizică', E'Страница 1\nEducația fizică\nSala sportivă', E'Страница 1\nEducația fizică\nSala sportivă', 3, 810, 900, E'EA-261,MN-261', NULL, NULL, E'ODD', E'', E'Sala sportivă', E'ODD'),
 (E'Educație fizică Sala sportivă', E'Educație fizică', E'Страница 1\nEducație fizică\nSala sportivă', E'Страница 1\nEducație fizică\nSala sportivă', 3, 810, 900, E'SI-262', NULL, NULL, E'EVEN', E'', E'Sala sportivă', E'EVEN'),
 (E'Etică și Securitate umană P.Russu', E'Etica și Securitate Umană', E'Страница 1\nEtica și Securitate Umană\nP.Russu\n614', E'Страница 1\nEtica și Securitate Umană\nP.Russu\n614', 0, 585, 675, E'SI-263,SI-264', NULL, E'614', E'EVERY', E'P.Russu', E'614', E'EVERY'),
 (E'Etică și Securitate umană P.Russu', E'Etică și Securitate umană', E'Страница 1\nEtică și Securitate umană\nP.Russu\n401', E'Страница 1\nEtică și Securitate umană\nP.Russu\n401', 2, 585, 675, E'SI-261,SI-262', NULL, E'401', E'EVERY', E'P.Russu', E'401', E'EVERY'),
 (E'Etică și Securitate umană P.Russu', E'Etică și Securitate umană', E'Страница 1\nEtică și Securitate umană\nP.Russu\n402', E'Страница 1\nEtică și Securitate umană\nP.Russu\n402', 0, 915, 1005, E'SI-265,SI-266', NULL, E'402', E'EVERY', E'P.Russu', E'402', E'EVERY'),
 (E'Etică și Securitate umană P.Russu', E'Etică și Securitate umană', E'Страница 1\nEtică și Securitate umană\nP.Russu\n505', E'Страница 1\nEtică și Securitate umană\nP.Russu\n505', 0, 810, 900, E'SI-261,SI-262', NULL, E'505', E'EVERY', E'P.Russu', E'505', E'EVERY'),
 (E'Etică și Securitate umană P.Russu', E'Etică și Securitate umană', E'Страница 1\nEtică și Securitate umană\nP.Russu\n505', E'Страница 1\nEtică și Securitate umană\nP.Russu\n505', 2, 690, 780, E'SI-265,SI-266', NULL, E'505', E'EVERY', E'P.Russu', E'505', E'EVERY'),
 (E'Etică și Securitate umană P.Russu', E'Etică și Securitate umană', E'Страница 1\nEtică și Securitate umană\nP.Russu\n609', E'Страница 1\nEtică și Securitate umană\nP.Russu\n609', 2, 480, 570, E'SI-263,SI-264', NULL, E'609', E'EVERY', E'P.Russu', E'609', E'EVERY'),
 (E'Hodinitu E.', E'L. Română', E'Страница 1\n107\nHodinitu E.', E'Страница 1\nL. Română\n107\nHodinitu E.', 0, 690, 780, E'TI-265', NULL, NULL, E'EVEN', E'Hodinitu E.', E'107', E'EVERY'),
 (E'Hodinitu E.', E'L. Română', E'Страница 1\n312\nHodinitu E.', E'Страница 1\nL. Română\n312\nHodinitu E.', 0, 480, 570, E'TI-264', NULL, NULL, E'EVEN', E'Hodinitu E.', E'312', E'EVERY'),
 (E'Hodinitu E.', E'L. Română', E'Страница 1\n312\nHodinitu E.', E'Страница 1\nL. Română\n312\nHodinitu E.', 1, 585, 675, E'EA-262,MN-262', NULL, NULL, E'EVEN', E'Hodinitu E.', E'312', E'EVERY'),
 (E'Hodinitu E.', E'L. Română', E'Страница 1\n405\nHodinitu E.', E'Страница 1\nL. Română\n405\nHodinitu E.', 3, 810, 900, E'IBM-262', NULL, NULL, E'EVEN', E'Hodinitu E.', E'405', E'EVERY'),
 (E'Hodinitu E.', E'L. Română', E'Страница 1\n707\nHodinitu E.', E'Страница 1\nL. Română\n707\nHodinitu E.', 1, 690, 780, E'SI-268', NULL, NULL, E'EVEN', E'Hodinitu E.', E'707', E'EVERY'),
 (E'Hodinitu E.', E'L. Română', E'Страница 1\n718\nHodinitu E.', E'Страница 1\nL. Română\n718\nHodinitu E.', 2, 810, 900, E'CR-263', NULL, NULL, E'EVEN', E'Hodinitu E.', E'718', E'EVERY'),
 (E'Lab. CDE', E'CDE', E'Страница 1\nLab.\nCDE\nLitra D.\n406', E'Страница 1\nLab.\nCDE\nLitra D.\n406', 2, 1020, 1110, E'AI-264,R-263', E'Litra D.', E'406', E'EVERY', E'Litra D.', E'406', E'EVERY'),
 (E'Lab. Fizica', E'Fizica', E'Страница 1\nLab. Fizica\nBernat O., Pilețchi N.', E'Страница 1\nLab. Fizica\nBernat O., Pilețchi N.', 2, 585, 675, E'IBM-261', E'Bernat O., Pilețchi N.', NULL, E'EVEN', E'Bernat O. Pilețchi N.', E'', E'EVEN'),
 (E'Litra D.', E'CDE', E'Страница 1\nlab. 0.5 gr. CDE\nLitra D.\n420', E'Страница 1\nlab. 0.5 gr. CDE\nLitra D.\n420', 2, 810, 1005, E'TI-263', NULL, E'420', E'EVERY', E'Litra D.', E'420', E'EVERY'),
 (E'Litra D.', E'CDE', E'Страница 1\nlab. 0.5 gr. CDE\nLitra D.\nA03', E'Страница 1\nlab. 0.5 gr. CDE\nLitra D.\nA03', 0, 810, 1005, E'TI-262', NULL, E'A03', E'EVERY', E'Litra D.', E'A03', E'EVERY'),
 (E'Litra D.', E'CDE', E'Страница 1\nlab. 0.5 gr. CDE\nLitra D.\nA03', E'Страница 1\nlab. 0.5 gr. CDE\nLitra D.\nA03', 3, 480, 675, E'TI-261', NULL, E'A03', E'EVERY', E'Litra D.', E'A03', E'EVERY'),
 (E'Metlinschi D.', E'CDE', E'Страница 1\nlab. 0.5 gr. CDE\nMetlinschi D.\n420', E'Страница 1\nlab. 0.5 gr. CDE\nMetlinschi D.\n420', 2, 480, 675, E'TI-265', NULL, E'420', E'EVERY', E'Metlinschi D.', E'420', E'EVERY'),
 (E'Nicolai F.', E'L. Engleză', E'Страница 1\n107\nNicolai F.', E'Страница 1\nL. Engleză\n107\nNicolai F.', 1, 915, 1005, E'R-262', NULL, NULL, E'EVEN', E'Nicolai F.', E'107', E'EVERY'),
 (E'Orlov V.', E'Algebra liniară și geometria analitică', E'Страница 1\nOrlov V.\n3-3', E'Страница 1\nc. Algebra Liniară și Geometria Analitică\nOrlov V.\n3-3', 0, 690, 780, E'AI-262,AI-263,CR-263,EA-262,IBM-262,MN-262,R-262,R-264', NULL, E'3-3', E'EVEN', E'Orlov V.', E'3-3', E'EVERY'),
 (E'Pușcașu A.', E'L. Engleză', E'Страница 1\n107/601\nPușcașu A.', E'Страница 1\nL. Engleză\n107/601\nPușcașu A.', 2, 810, 900, E'SI-266', NULL, NULL, E'EVEN', E'Pușcașu A.', E'107/601', E'EVERY'),
 (E'Pușcașu A.', E'L. Engleză', E'Страница 1\n718/312\nPușcașu A.', E'Страница 1\nL. Engleză\n718/312\nPușcașu A.', 0, 690, 780, E'TI-263', NULL, NULL, E'EVEN', E'Pușcașu A.', E'718/312', E'EVERY'),
 (E'Strucova T.', E'Fizica', E'Страница 1\nStrucova T.', E'Страница 1\nlab. Fizica\nStrucova T.', 1, 585, 675, E'CR-263', NULL, NULL, E'EVEN', E'Strucova T.', E'', E'EVEN'),
 (E'Strucova T., Pilețchi T.', E'Fizica', E'Страница 1\nStrucova T., Pilețchi T.', E'Страница 1\nlab. Fizică\nStrucova T., Pilețchi T.', 2, 810, 900, E'IBM-262', NULL, NULL, E'EVEN', E'Strucova T. Pilețchi T.', E'', E'EVEN'),
 (E'Tintiuc C.', E'L. Engleză', E'Страница 1\n107/601\nTintiuc C.', E'Страница 1\nL. Engleză\n107/601\nTintiuc C.', 0, 810, 900, E'SI-265', NULL, NULL, E'EVEN', E'Tintiuc C.', E'107/601', E'EVERY'),
 (E'Tintiuc C.', E'L. Engleză', E'Страница 1\n404\nTintiuc C.', E'Страница 1\nL. Engleză\n404\nTintiuc C.', 4, 810, 900, E'EA-262,MN-262', NULL, NULL, E'EVEN', E'Tintiuc C.', E'404', E'EVERY'),
 (E'Tintiuc C.', E'L. Engleză', E'Страница 1\n630/624\nTintiuc C.', E'Страница 1\nL. Engleză\n630/624\nTintiuc C.', 3, 480, 570, E'SI-261', NULL, NULL, E'EVEN', E'Tintiuc C.', E'630/624', E'EVERY'),
 (E'Veleșcu L.', E'L. Engleză', E'Страница 1\n107\nVeleșcu L.', E'Страница 1\nL. Engleză\n107\nVeleșcu L.', 2, 690, 780, E'TI-265', NULL, NULL, E'EVEN', E'Veleșcu L.', E'107', E'EVERY'),
 (E'Veleșcu L.', E'L. Engleză', E'Страница 1\n203\nVeleșcu L.', E'Страница 1\nL. Engleză\n203\nVeleșcu L.', 0, 690, 780, E'TI-264', NULL, NULL, E'EVEN', E'Veleșcu L.', E'203', E'EVERY'),
 (E'Veleșcu L.', E'L. Engleză', E'Страница 1\n203\nVeleșcu L.', E'Страница 1\nL. Engleză\n203\nVeleșcu L.', 4, 480, 570, E'SI-268', NULL, NULL, E'EVEN', E'Veleșcu L.', E'203', E'EVERY'),
 (E'Veleșcu L.', E'L. Engleză', E'Страница 1\n606/607\nVeleșcu L.', E'Страница 1\nL. Engleză\n606/607\nVeleșcu L.', 2, 480, 570, E'SI-262', NULL, NULL, E'EVEN', E'Veleșcu L.', E'606/607', E'EVERY'),
 (E'Veleșcu L.', E'L. Engleză', E'Страница 1\n720\n601\nVeleșcu L.', E'Страница 1\nL. Engleză\n720\n601\nVeleșcu L.', 3, 690, 780, E'TI-262', NULL, NULL, E'EVEN', E'Veleșcu L.', E'720 / 601', E'EVERY'),
 (E'Șișianu A.', E'L. Engleză', E'Страница 1\n707\nȘișianu A.', E'Страница 1\nL. Engleză\n707\nȘișianu A.', 4, 915, 1005, E'AI-262,AI-263,R-264', NULL, NULL, E'EVEN', E'Șișianu A.', E'707', E'EVERY'),
 (E'Șova M.', E'L. Engleză', E'Страница 1\n107\nSova M.', E'Страница 1\nL. Engleză\n107\nSova M.', 4, 810, 900, E'SI-269', NULL, NULL, E'EVEN', E'Sova M.', E'107', E'EVERY'),
 (E'Șova M.', E'L. Engleză', E'Страница 1\n606/613\nȘova M.', E'Страница 1\nL. Engleză\n606/613\nȘova M.', 2, 690, 780, E'SI-264', NULL, NULL, E'EVEN', E'Șova M.', E'606/613', E'EVERY'),
 (E'Șova M.,Nicolai F.', E'L. Engleză', E'Страница 1\nȘova M.,Nicolai F.', E'Страница 1\nL. Engleză\n404/718\nȘova M.,Nicolai F.', 3, 690, 780, E'IBM-262', NULL, NULL, E'EVEN', E'Șova M. Nicolai F.', E'404/718', E'EVERY');
CREATE TEMP TABLE eligible_pdf_repairs ON COMMIT DROP AS
SELECT l.id, l."scheduleId", r.* FROM "Lesson" l
JOIN "Subject" s ON s.id = l."subjectId"
JOIN "ScheduleImport" si ON si.id = l."scheduleId"
JOIN pdf_subject_repairs r ON r.old_name = s.name AND r.old_source = l."sourceText"
 AND r.day = l.weekday AND r.start_min = l."startMinutes" AND r.end_min = l."endMinutes"
 AND r.old_teacher IS NOT DISTINCT FROM l.teacher
 AND r.old_room IS NOT DISTINCT FROM l.classroom AND r.old_week = l."weekPattern"::text
WHERE NOT l.reviewed AND l."sourceSubjectName" IS NULL
 AND si.kind <> 'ASSESSMENT' AND si."sourceFileKey" IS NOT NULL
 AND s.code IS NULL AND s.faculty IS NULL AND s."ectsCredits" IS NULL
 AND s.status = 'ACTIVE' AND s."colorKey" = 'blue'
 AND r.groups = (SELECT string_agg(g.name, ',' ORDER BY g.name)
 FROM "LessonAudience" la JOIN "StudyGroup" g ON g.id = la."groupId" WHERE la."lessonId" = l.id)
 AND NOT EXISTS (SELECT 1 FROM "LessonAudience" la WHERE la."lessonId" = l.id AND la."subgroupId" IS NOT NULL);
INSERT INTO "Subject" (id, name)
SELECT 'pdf-repair-' || md5(new_name), new_name FROM eligible_pdf_repairs GROUP BY new_name
ON CONFLICT (name) DO NOTHING;
UPDATE "Lesson" l SET "subjectId" = s.id, teacher = NULLIF(r.teacher, ''),
 classroom = NULLIF(r.room, ''), "sourceText" = r.new_source, "sourceSubjectName" = r.new_name,
 "weekPattern" = r.week::"WeekPattern"
FROM eligible_pdf_repairs r JOIN "Subject" s ON s.name = r.new_name WHERE l.id = r.id;
UPDATE "ScheduleImport" SET "updatedAt" = CURRENT_TIMESTAMP
WHERE id IN (SELECT "scheduleId" FROM eligible_pdf_repairs);

-- Remove only known orphan import artifacts without administrator metadata.
CREATE TEMP TABLE orphan_pdf_repairs (old_name text, new_name text) ON COMMIT DROP;
INSERT INTO orphan_pdf_repairs VALUES
 (E'BD Bulai R. D-01/03', E'BD'),
 (E'BD1 Bulai R. D-01/03', E'BD1'),
 (E'Braga M.', NULL),
 (E'Bumbu T.', NULL),
 (E'Buza D.', NULL),
 (E'C. Tehnici d eprogramare', E'Tehnici d eprogramare'),
 (E'CDE Bîrnaz', E'CDE'),
 (E'CI 2 A03 Magariu N.', E'CI 2'),
 (E'Cantir L.', NULL),
 (E'DEMTPI Astafi V', E'DEMTPI'),
 (E'Dumitrașcu M.', NULL),
 (E'Dutova L.', NULL),
 (E'ESU P. Russu', E'ESU'),
 (E'Ed. Fizică Sala sportivă', E'Ed. Fizică'),
 (E'Educația fizică Sala sportivă', E'Educația fizică'),
 (E'Educație fizică Sala sportivă', E'Educație fizică'),
 (E'Etică și Securitate umană P.Russu', E'Etică și Securitate umană'),
 (E'Hodinitu E.', NULL),
 (E'L. Engleză 512 Dutova L.', E'L. Engleză'),
 (E'L. Engleză 611 Pușcașu A.', E'L. Engleză'),
 (E'L. Engleză 611 Tintiuc C.', E'L. Engleză'),
 (E'L. Engleză 611 Șova M.', E'L. Engleză'),
 (E'L. Engleză 624 Dutova L.', E'L. Engleză'),
 (E'Lab. AFU', E'AFU'),
 (E'Lab. CDE', E'CDE'),
 (E'Lab. Fizica', E'Fizica'),
 (E'Lab. ME', E'ME'),
 (E'Lab. PADM 1/l', E'PADM 1/l'),
 (E'Lab.PAE', E'PAE'),
 (E'Litra D.', NULL),
 (E'MP (octombrie / noiembrie) Negritu G.', E'MP (octombrie / noiembrie)'),
 (E'MS Costaș A. 3-3 Amdaris', E'MS'),
 (E'Maftei V.', NULL),
 (E'Matematici Speciale Bostan V. 3-3 Amdaris', E'Matematici Speciale'),
 (E'Matematici Speciale Bostan V. ; Cojuhari E. 3-3 Amdaris', E'Matematici Speciale'),
 (E'Matematici Speciale Costaș A. 3-3 Amdaris', E'Matematici Speciale'),
 (E'Metlinschi D.', NULL),
 (E'Nicolai F.', NULL),
 (E'Orlov V.', NULL),
 (E'PD (octombrie/ noiembrie) Leah A.', E'PD (octombrie/ noiembrie)'),
 (E'POO Gîncu S. 6-2 MCE MCE', E'POO'),
 (E'PR Fiştic Cr', E'PR'),
 (E'Programarea declarativă Rusu M. 3-3 Amdaris', E'Programarea declarativă'),
 (E'Pușcașu A.', NULL),
 (E'Reițman P.', NULL),
 (E'SM (octombire/noiembrie) Verjbițchi V.', E'SM (octombire/noiembrie)'),
 (E'SM (octombrie / noiembrie) Verjbițchi V.', E'SM (octombrie / noiembrie)'),
 (E'SM (octombrie/noiembrie) Verjbițchi V.', E'SM (octombrie/noiembrie)'),
 (E'SO Bunescu M', E'SO'),
 (E'Securitatea si sănătatea în muncă Crețu V. 3-3 Amdaris', E'Securitatea și Sănătatea în Muncă'),
 (E'Strucova T.', NULL),
 (E'Strucova T., Pilețchi T.', NULL),
 (E'Tintiuc C.', NULL),
 (E'Veleșcu L.', NULL),
 (E'Zbancă A. Aula 6-2 Henri Coandă', NULL),
 (E'Zbancă D. Aula 6-2 Henri Coandă', NULL),
 (E'sem. ASDN', E'ASDN'),
 (E'Șișianu A.', NULL),
 (E'Șova M.', NULL),
 (E'Șova M.,Nicolai F.', NULL),
 (E'Țugulea V.', NULL);
UPDATE "Subject" s SET name = r.new_name FROM orphan_pdf_repairs r
WHERE s.name = r.old_name AND r.new_name IS NOT NULL
 AND s.code IS NULL AND s.faculty IS NULL AND s."ectsCredits" IS NULL
 AND s.status = 'ACTIVE' AND s."colorKey" = 'blue'
 AND NOT EXISTS (SELECT 1 FROM "Lesson" l WHERE l."subjectId" = s.id)
 AND NOT EXISTS (SELECT 1 FROM "Subject" t WHERE t.name = r.new_name)
 AND s.id = (SELECT min(candidate.id) FROM "Subject" candidate
 JOIN orphan_pdf_repairs other ON other.old_name = candidate.name AND other.new_name = r.new_name
 WHERE candidate.code IS NULL AND candidate.faculty IS NULL AND candidate."ectsCredits" IS NULL
 AND candidate.status = 'ACTIVE' AND candidate."colorKey" = 'blue'
 AND NOT EXISTS (SELECT 1 FROM "Lesson" l WHERE l."subjectId" = candidate.id));
DELETE FROM "Subject" s USING orphan_pdf_repairs r
WHERE s.name = r.old_name AND s.code IS NULL AND s.faculty IS NULL AND s."ectsCredits" IS NULL
 AND s.status = 'ACTIVE' AND s."colorKey" = 'blue'
 AND NOT EXISTS (SELECT 1 FROM "Lesson" l WHERE l."subjectId" = s.id)
 AND (r.new_name IS NULL OR EXISTS (SELECT 1 FROM "Subject" t WHERE t.name = r.new_name AND t.id <> s.id));
COMMIT;
