-- One character name per world: case-insensitive uniqueness (app stores trimmed names).
-- Characters were removed later; guard this migration so clean deployments still pass.
DO $$
BEGIN
  IF to_regclass('"Character"') IS NOT NULL THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "Character_name_lower_key" ON "Character" (LOWER("name"))';
  END IF;
END $$;
