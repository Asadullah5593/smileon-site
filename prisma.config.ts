import { defineConfig } from "prisma/config";

// Prisma 7 moved the connection URL out of `schema.prisma`. The CLI (migrate,
// db push, studio) reads it from here; the runtime client gets it through the
// driver adapter in `src/shared/db/prisma.ts`.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
