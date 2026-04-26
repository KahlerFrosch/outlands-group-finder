-- Move legacy PvM + Quests sub-type groups to top-level Quests category
UPDATE "Group"
SET
  "contentType" = 'Quests',
  "contentSubType" = NULL,
  "contentTertiary" = NULL
WHERE "contentType" = 'PvM' AND "contentSubType" = 'Quests';
