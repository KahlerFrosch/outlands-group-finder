-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Character_discordId_idx" ON "Character"("discordId");

-- CreateIndex
CREATE INDEX "Character_discordId_isActive_idx" ON "Character"("discordId", "isActive");
