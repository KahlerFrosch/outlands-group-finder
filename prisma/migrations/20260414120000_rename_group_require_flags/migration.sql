-- Rename: these apply to all members (leader included), not only applicants.
ALTER TABLE "Group" RENAME COLUMN "requireApplicantRoleSelection" TO "requireRoleSelection";
ALTER TABLE "Group" RENAME COLUMN "requireApplicantRedlinePoints" TO "requireRedlinePoints";
ALTER TABLE "Group" RENAME COLUMN "requireApplicantChainLinks" TO "requireChainLinks";
