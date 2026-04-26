-- AlterTable
ALTER TABLE "Group" ADD COLUMN "requireApplicantRoleSelection" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Group"
SET "requireApplicantRoleSelection" = true
WHERE "contentType" = 'Mentoring';
