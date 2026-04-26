-- AlterTable
ALTER TABLE "Group" ADD COLUMN "voiceChannelListen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Group" ADD COLUMN "voiceChannelSpeak" BOOLEAN NOT NULL DEFAULT false;
