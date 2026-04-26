-- AlterTable
ALTER TABLE "Group" ADD COLUMN "requireApplicantCharacterSelection" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Group"
SET "requireApplicantCharacterSelection" = true
WHERE "requireApplicantChainLinks" = true OR "requireApplicantRedlinePoints" = true;

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN "characterId" TEXT;

-- AlterTable
ALTER TABLE "GroupApplication" ADD COLUMN "characterId" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "Character_discordId_isActive_idx";

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "isActive";

-- CreateIndex
CREATE INDEX "GroupMember_characterId_idx" ON "GroupMember"("characterId");

-- CreateIndex
CREATE INDEX "GroupApplication_characterId_idx" ON "GroupApplication"("characterId");

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupApplication" ADD CONSTRAINT "GroupApplication_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
