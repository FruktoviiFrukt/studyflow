CREATE TYPE "ScheduleKind" AS ENUM ('STUDENT', 'GLOBAL', 'ASSESSMENT');

ALTER TABLE "ScheduleImport"
ADD COLUMN "kind" "ScheduleKind" NOT NULL DEFAULT 'STUDENT';

CREATE INDEX "ScheduleImport_kind_status_validFrom_validTo_idx"
ON "ScheduleImport"("kind", "status", "validFrom", "validTo");
