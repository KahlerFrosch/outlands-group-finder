-- AlterTable
ALTER TABLE "Group" ADD COLUMN "requireApplicantChainLinks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requireApplicantRedlinePoints" BOOLEAN NOT NULL DEFAULT false;
