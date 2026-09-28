-- Leave existing subjects unset: schedule imports do not contain ECTS values.
ALTER TABLE "Subject" ADD COLUMN "ectsCredits" DECIMAL(4,1);
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_ectsCredits_check"
CHECK ("ectsCredits" IS NULL OR ("ectsCredits" > 0 AND "ectsCredits" <= 60));
