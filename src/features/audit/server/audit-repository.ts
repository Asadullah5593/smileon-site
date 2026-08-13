import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toSkipTake } from "@/shared/api/list-query";
import type { AuditEntryDto, AuditFacets, AuditListQuery } from "@/features/audit/schemas";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Reads of the audit log.
 *
 * Writes live in `shared/audit/audit-log.ts` because every module calls
 * `recordAudit` — that is a cross-cutting concern rather than a feature. This
 * file is the only reader, and it is **read-only by design**: there is no
 * update or delete, and no route exposes one. An audit trail an administrator
 * can edit is not an audit trail.
 */

const withActor = { actor: { select: { name: true } } } satisfies Prisma.AuditLogInclude;

type AuditRow = Prisma.AuditLogGetPayload<{ include: typeof withActor }>;

function toAuditEntryDto(entry: AuditRow): AuditEntryDto {
  return {
    id: entry.id,
    actorId: entry.actorId,
    // Null once the actor's account is deleted (`onDelete: SetNull`) — the
    // entry itself survives, which is the point.
    actorName: entry.actor?.name ?? null,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    summary: entry.summary,
    diff: entry.diff,
    createdAt: entry.createdAt.toISOString(),
  };
}

function toWhere(query: AuditListQuery): Prisma.AuditLogWhereInput {
  return {
    ...(query.actorId ? { actorId: query.actorId } : {}),
    ...(query.entity ? { entity: query.entity } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
            ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(query.q
      ? { OR: [{ summary: { contains: query.q } }, { entityId: { contains: query.q } }] }
      : {}),
  };
}

export async function listAuditEntries(query: AuditListQuery) {
  const where = toWhere(query);

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: withActor,
      orderBy: { createdAt: "desc" },
      ...toSkipTake(query),
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginate(rows.map(toAuditEntryDto), total, query.page, query.pageSize);
}

/** Every matching row, ignoring pagination — for the CSV export. */
export async function listAuditEntriesForExport(query: AuditListQuery) {
  const rows = await prisma.auditLog.findMany({
    where: toWhere(query),
    include: withActor,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  return rows.map(toAuditEntryDto);
}

export async function getAuditFacets(): Promise<AuditFacets> {
  const [actions, entities, actors] = await Promise.all([
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
    prisma.auditLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    }),
    prisma.user.findMany({
      where: { auditLogs: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    actions: actions.map((row) => row.action),
    entities: entities.map((row) => row.entity),
    actors,
  };
}
