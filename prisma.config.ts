import { defineConfig } from "prisma/config";
import { loadEnv } from "./prisma/load-env";

// Prisma 7 no longer reads `.env` on its own.
loadEnv();

// Prisma 7 also moved the connection URL out of `schema.prisma`. The CLI
// (migrate, db push, studio) reads it from here; the runtime client gets it
// through the driver adapter in `src/shared/db/prisma.ts`.
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
