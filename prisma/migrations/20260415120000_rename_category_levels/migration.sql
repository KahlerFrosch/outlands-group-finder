-- Align DB column names with hierarchical category levels (extensible to level 4+ later).
ALTER TABLE "Group" RENAME COLUMN "contentType" TO "categoryLevel1";
ALTER TABLE "Group" RENAME COLUMN "contentSubType" TO "categoryLevel2";
ALTER TABLE "Group" RENAME COLUMN "contentTertiary" TO "categoryLevel3";
