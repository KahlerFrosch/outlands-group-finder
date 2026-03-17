-- AlterTable: add expiresAt with 1 hour lifetime for existing groups
ALTER TABLE "Group" ADD COLUMN "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- For existing rows, set expiresAt = createdAt + 1 hour
UPDATE "Group"
SET "expiresAt" = "createdAt" + INTERVAL '1 hour';

