-- DropForeignKey
ALTER TABLE "Topic" DROP CONSTRAINT "Topic_subjectId_fkey";

-- DropIndex
DROP INDEX "Topic_subjectId_name_key";

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "subjectId";

-- CreateTable
CREATE TABLE "_FacultySubjectToTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FacultySubjectToTopic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FacultySubjectToTopic_B_index" ON "_FacultySubjectToTopic"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- AddForeignKey
ALTER TABLE "_FacultySubjectToTopic" ADD CONSTRAINT "_FacultySubjectToTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "FacultySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacultySubjectToTopic" ADD CONSTRAINT "_FacultySubjectToTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
