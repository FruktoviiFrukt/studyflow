-- Preserve imported subjects and their existing lesson references.
CREATE TYPE "SubjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

ALTER TABLE "Subject"
ADD COLUMN "code" TEXT,
ADD COLUMN "faculty" TEXT,
ADD COLUMN "status" "SubjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- PostgreSQL permits multiple NULL values: imported subjects need no code.
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");
