import { existsSync } from "node:fs";

/**
 * Prisma 7 dropped automatic `.env` loading, and `tsx` never had it — only the
 * Next.js runtime reads these files by itself. So the CLI entry points
 * (`prisma.config.ts`, `prisma/seed.ts`) load them explicitly.
 *
 * `loadEnvFile` never overwrites a variable that is already set, so real
 * environment values (CI, Docker) always win over the files, and `.env` stays
 * the fallback baseline behind `.env.local`.
 */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}
