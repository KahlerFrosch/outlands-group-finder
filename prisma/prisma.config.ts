import { defineConfig } from "prisma";

export default defineConfig({
  schema: "./schema.prisma",
  datasource: {
    db: {
      provider: "postgresql",
      url: { fromEnvVar: "DATABASE_URL" }
    }
  },
  seed: "node prisma/seed.js"
});

