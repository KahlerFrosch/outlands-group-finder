-- AlterTable
ALTER TABLE "Group" ADD COLUMN "requireApplicantRedlinePoints" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Group" ADD COLUMN "requireApplicantChainLinks" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN "redlinePoints" INTEGER;
ALTER TABLE "GroupMember" ADD COLUMN "chainLinkSlots" INTEGER;

-- AlterTable
ALTER TABLE "GroupApplication" ADD COLUMN "redlinePoints" INTEGER;
ALTER TABLE "GroupApplication" ADD COLUMN "chainLinkSlots" INTEGER;
