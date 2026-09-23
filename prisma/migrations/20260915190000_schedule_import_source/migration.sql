ALTER TABLE "ScheduleImport" ADD COLUMN "importWarnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Lesson" ADD COLUMN "sourceText" TEXT;
