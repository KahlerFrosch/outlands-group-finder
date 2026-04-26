CREATE TABLE "GroupChatMessage" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupChatMessage_groupId_createdAt_idx" ON "GroupChatMessage"("groupId", "createdAt");

ALTER TABLE "GroupChatMessage" ADD CONSTRAINT "GroupChatMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
