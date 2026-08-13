import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { storage } from "@/shared/storage";
import { log } from "@/shared/observability/logger";
import { checkDatabase } from "@/app/api/health/route";

export const dynamic = "force-dynamic";

/**
 * **Readiness.** Should this instance receive traffic?
 *
 * Unlike liveness, this checks the things a request actually needs. A load
 * balancer takes a failing instance out of rotation without restarting it,
 * which is the right response to a dependency being briefly unavailable.
 */
export async function GET() {
  const [database, migrations] = await Promise.all([checkDatabase(), checkMigrations()]);

  const ready = database.ok && migrations.ok;

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks: { database, migrations, storage: { driver: storage.name } },
    },
    { status: ready ? 200 : 503 },
  );
}

/**
 * A container started against a database that hasn't been migrated will fail in
 * confusing ways at the first query. Better to refuse traffic and say why.
 */
async function checkMigrations() {
  try {
    const rows = await prisma.$queryRaw<
      { count: bigint }[]
    >`SELECT COUNT(*) as count FROM _prisma_migrations WHERE finished_at IS NULL`;

    const pending = Number(rows[0]?.count ?? 0);
    return { ok: pending === 0, pending };
  } catch (error) {
    log.error("migration probe failed", { error });
    return { ok: false, pending: null };
  }
}
