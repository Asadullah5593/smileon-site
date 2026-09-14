import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { log } from "@/shared/observability/logger";

export const dynamic = "force-dynamic";

/**
 * **Liveness.** Is the process up and serving? Never touches the database.
 *
 * An orchestrator restarts a container that fails its liveness probe, so
 * checking a dependency here would turn a brief database blip into a restart
 * loop that makes the outage worse. Dependencies belong in `/api/health/ready`.
 */
export function GET() {
  return NextResponse.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()) });
}

/** Shared by the readiness route. */
export async function checkDatabase() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true as const, latencyMs: Date.now() - startedAt };
  } catch (error) {
    log.error("database probe failed", { error });
    return { ok: false as const, latencyMs: Date.now() - startedAt };
  }
}
