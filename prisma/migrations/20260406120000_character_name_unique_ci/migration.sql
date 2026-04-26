-- One character name per world: case-insensitive uniqueness (app stores trimmed names).
CREATE UNIQUE INDEX "Character_name_lower_key" ON "Character" (LOWER("name"));
