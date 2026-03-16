-- CreateTable
CREATE TABLE "GroupApplication" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupApplication_groupId_discordId_key" ON "GroupApplication"("groupId", "discordId");

-- CreateIndex
CREATE INDEX "GroupApplication_groupId_idx" ON "GroupApplication"("groupId");

-- AddForeignKey
ALTER TABLE "GroupApplication" ADD CONSTRAINT "GroupApplication_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
