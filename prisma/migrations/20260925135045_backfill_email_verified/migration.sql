-- Grandfather in accounts that existed before email verification was
-- introduced — they never went through the flow, so login would otherwise
-- lock them out. New registrations still get a real, unset emailVerified.
UPDATE "User" SET "emailVerified" = "createdAt" WHERE "emailVerified" IS NULL;
