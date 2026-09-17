BEGIN;

-- CreateEnum
CREATE TYPE "WeekPattern" AS ENUM ('EVERY', 'ODD', 'EVEN');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('LECTURE', 'LABORATORY', 'PRACTICE', 'SEMINAR', 'UNSPECIFIED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "subgroupId" TEXT;

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "firstOddWeekMonday" DATE NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "StudyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subgroup" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    CONSTRAINT "Subgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorKey" TEXT NOT NULL DEFAULT 'blue',

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleImport" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "course" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "sourceFilename" TEXT,
    "sourceFileKey" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "validFrom" DATE NOT NULL,
    "validTo" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "weekPattern" "WeekPattern" NOT NULL DEFAULT 'EVERY',
    "type" "LessonType" NOT NULL DEFAULT 'UNSPECIFIED',
    "teacher" TEXT,
    "classroom" TEXT,
    "topic" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonAudience" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "subgroupId" TEXT,

    CONSTRAINT "LessonAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleHoliday" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,

    CONSTRAINT "ScheduleHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_academicYearId_number_key" ON "Semester"("academicYearId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroup_name_key" ON "StudyGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subgroup_groupId_number_key" ON "Subgroup"("groupId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Subgroup_id_groupId_key" ON "Subgroup"("id", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "ScheduleImport_semesterId_course_status_idx" ON "ScheduleImport"("semesterId", "course", "status");

-- CreateIndex
CREATE INDEX "ScheduleImport_status_validFrom_validTo_idx" ON "ScheduleImport"("status", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "Lesson_scheduleId_weekday_startMinutes_idx" ON "Lesson"("scheduleId", "weekday", "startMinutes");

-- CreateIndex
CREATE INDEX "Lesson_subjectId_idx" ON "Lesson"("subjectId");

-- CreateIndex
CREATE INDEX "LessonAudience_groupId_lessonId_idx" ON "LessonAudience"("groupId", "lessonId");

-- CreateIndex
CREATE INDEX "LessonAudience_subgroupId_groupId_idx" ON "LessonAudience"("subgroupId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonAudience_lessonId_groupId_subgroupId_key" ON "LessonAudience"("lessonId", "groupId", "subgroupId");

-- CreateIndex
CREATE INDEX "ScheduleHoliday_scheduleId_startsOn_endsOn_idx" ON "ScheduleHoliday"("scheduleId", "startsOn", "endsOn");

-- CreateIndex
CREATE INDEX "User_groupId_idx" ON "User"("groupId");

-- CreateIndex
CREATE INDEX "User_subgroupId_groupId_idx" ON "User"("subgroupId", "groupId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_subgroupId_groupId_fkey" FOREIGN KEY ("subgroupId", "groupId") REFERENCES "Subgroup"("id", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subgroup" ADD CONSTRAINT "Subgroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleImport" ADD CONSTRAINT "ScheduleImport_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ScheduleImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAudience" ADD CONSTRAINT "LessonAudience_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAudience" ADD CONSTRAINT "LessonAudience_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAudience" ADD CONSTRAINT "LessonAudience_subgroupId_groupId_fkey" FOREIGN KEY ("subgroupId", "groupId") REFERENCES "Subgroup"("id", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleHoliday" ADD CONSTRAINT "ScheduleHoliday_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ScheduleImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Checks are maintained in SQL: Prisma schema cannot express these constraints.
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_dates_check"
  CHECK ("startsOn" <= "endsOn" AND EXTRACT(ISODOW FROM "firstOddWeekMonday") = 1
    AND "firstOddWeekMonday" BETWEEN "startsOn" - 6 AND "endsOn");
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_dates_number_check"
  CHECK ("startsOn" <= "endsOn" AND "number" IN (1, 2));
ALTER TABLE "Subgroup" ADD CONSTRAINT "Subgroup_number_check" CHECK ("number" IN (1, 2));
ALTER TABLE "User" ADD CONSTRAINT "User_subgroup_requires_group_check"
  CHECK ("subgroupId" IS NULL OR "groupId" IS NOT NULL);
ALTER TABLE "ScheduleImport" ADD CONSTRAINT "ScheduleImport_dates_course_check"
  CHECK ("validFrom" <= "validTo" AND "course" > 0);
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_weekday_time_check"
  CHECK ("weekday" BETWEEN 0 AND 6 AND "startMinutes" >= 0
    AND "endMinutes" <= 1440 AND "startMinutes" < "endMinutes");
ALTER TABLE "ScheduleHoliday" ADD CONSTRAINT "ScheduleHoliday_dates_check"
  CHECK ("startsOn" <= "endsOn");
-- PostgreSQL's ordinary UNIQUE permits repeated NULL subgroup IDs.
CREATE UNIQUE INDEX "LessonAudience_whole_group_key"
  ON "LessonAudience" ("lessonId", "groupId") WHERE "subgroupId" IS NULL;

-- Preserve the existing registration contract and map current users to groups.
-- Include allowed registration choices even on an empty database.
INSERT INTO "StudyGroup" ("id", "name")
SELECT 'group_' || md5("name"), "name" FROM (
  SELECT "group" AS "name" FROM "User" WHERE "group" IS NOT NULL AND btrim("group") <> ''
  UNION SELECT 'TI-245'
  UNION SELECT 'TI-246'
) AS existing_groups;

INSERT INTO "Subgroup" ("id", "groupId", "number")
SELECT 'subgroup_' || md5(g."id" || ':' || n::text), g."id", n
FROM "StudyGroup" g CROSS JOIN generate_series(1, 2) AS n;

UPDATE "User" u SET "groupId" = g."id"
FROM "StudyGroup" g WHERE u."group" = g."name";
-- Do not guess a student's subgroup; it remains NULL until chosen in the profile.
COMMIT;
