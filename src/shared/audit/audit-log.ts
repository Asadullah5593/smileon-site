import "server-only";
import { prisma } from "@/shared/db/prisma";

export type AuditEntry = {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  summary?: string;
  diff?: unknown;
};

/**
 * Append-only record of who changed what. Never allowed to break the mutation
 * that triggered it — a failed audit write is logged, not thrown.
 */
export async function recordAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        summary: entry.summary ?? null,
        diff: entry.diff === undefined ? undefined : JSON.parse(JSON.stringify(entry.diff)),
      },
    });
  } catch (error) {
    console.error("[audit] failed to record entry", entry.action, error);
  }
}

/** Shallow before/after diff, limited to keys that actually changed. */
export function diffOf<T extends Record<string, unknown>>(before: T | null, after: T) {
  if (!before) return { created: after };
  const changed: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed[key] = { from: before[key], to: after[key] };
    }
  }
  return changed;
}
