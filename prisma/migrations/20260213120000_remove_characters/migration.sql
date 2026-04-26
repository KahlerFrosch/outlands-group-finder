-- RemoveCharacter
ALTER TABLE "GroupMember" DROP CONSTRAINT IF EXISTS "GroupMember_characterId_fkey";
ALTER TABLE "GroupApplication" DROP CONSTRAINT IF EXISTS "GroupApplication_characterId_fkey";

DROP INDEX IF EXISTS "GroupMember_characterId_idx";
DROP INDEX IF EXISTS "GroupApplication_characterId_idx";

ALTER TABLE "GroupMember" DROP COLUMN IF EXISTS "characterId";
ALTER TABLE "GroupApplication" DROP COLUMN IF EXISTS "characterId";

ALTER TABLE "Group" DROP COLUMN IF EXISTS "requireApplicantCharacterSelection";
ALTER TABLE "Group" DROP COLUMN IF EXISTS "requireApplicantChainLinks";
ALTER TABLE "Group" DROP COLUMN IF EXISTS "requireApplicantRedlinePoints";

DROP TABLE IF EXISTS "Character";
