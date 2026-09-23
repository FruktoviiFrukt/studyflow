-- Keep existing rows unset: the catalog name may already differ from the PDF.
ALTER TABLE "Lesson" ADD COLUMN "sourceSubjectName" TEXT;
