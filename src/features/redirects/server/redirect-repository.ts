import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { ConflictError, NotFoundError } from "@/shared/api/errors";
import { recordAudit } from "@/shared/audit/audit-log";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import {
  parseBulkRedirects,
  type RedirectCreateInput,
  type RedirectDto,
  type RedirectListQuery,
  type RedirectUpdateInput,
} from "@/features/redirects/schemas";
import type { Viewer } from "@/shared/auth/permissions";
import type { Prisma, Redirect } from "@/generated/prisma/client";

/**
 * All `Redirect` data access.
 *
 * Consumed by `app/(public)/[...slug]/page.tsx`: when no page or post matches a
 * path, that route asks here before returning a 404.
 */

function toRedirectDto(redirect: Redirect): RedirectDto {
  return {
    id: redirect.id,
    source: redirect.source,
    target: redirect.target,
    permanent: redirect.permanent,
    createdAt: redirect.createdAt.toISOString(),
  };
}

const SORTABLE = ["source", "target", "createdAt"] as const;

export async function listRedirects(query: RedirectListQuery) {
  const where: Prisma.RedirectWhereInput = query.q
    ? { OR: [{ source: { contains: query.q } }, { target: { contains: query.q } }] }
    : {};

  const [rows, total] = await Promise.all([
    prisma.redirect.findMany({
      where,
      orderBy: toOrderBy(query, SORTABLE, { createdAt: "desc" }),
      ...toSkipTake(query),
    }),
    prisma.redirect.count({ where }),
  ]);

  return paginate(rows.map(toRedirectDto), total, query.page, query.pageSize);
}

/** Public lookup. `path` is site-relative and starts with a slash. */
export async function findRedirect(path: string) {
  const normalised = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const redirect = await prisma.redirect.findUnique({ where: { source: normalised } });
  return redirect ? { target: redirect.target, permanent: redirect.permanent } : null;
}

export async function createRedirect(
  input: RedirectCreateInput,
  viewer: Viewer,
): Promise<RedirectDto> {
  await assertNoLoop(input.source, input.target);

  const redirect = await prisma.redirect.create({ data: input });

  await recordAudit({
    actorId: viewer.id,
    action: "redirects.create",
    entity: "Redirect",
    entityId: redirect.id,
    summary: `${redirect.source} → ${redirect.target}`,
  });
  revalidateContent(CACHE_TAGS.redirects);

  return toRedirectDto(redirect);
}

export async function updateRedirect(
  id: string,
  input: RedirectUpdateInput,
  viewer: Viewer,
): Promise<RedirectDto> {
  const existing = await prisma.redirect.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Redirect");

  const source = input.source ?? existing.source;
  const target = input.target ?? existing.target;
  if (source === target) throw new ConflictError("A redirect cannot point at itself.");
  await assertNoLoop(source, target, id);

  const redirect = await prisma.redirect.update({ where: { id }, data: input });

  await recordAudit({
    actorId: viewer.id,
    action: "redirects.update",
    entity: "Redirect",
    entityId: id,
    summary: `${redirect.source} → ${redirect.target}`,
  });
  revalidateContent(CACHE_TAGS.redirects);

  return toRedirectDto(redirect);
}

export async function deleteRedirect(id: string, viewer: Viewer) {
  const redirect = await prisma.redirect.delete({ where: { id } }).catch(() => null);
  if (!redirect) throw new NotFoundError("Redirect");

  await recordAudit({
    actorId: viewer.id,
    action: "redirects.delete",
    entity: "Redirect",
    entityId: id,
    summary: `${redirect.source} → ${redirect.target}`,
  });
  revalidateContent(CACHE_TAGS.redirects);
}

/** Import pasted lines, skipping ones that already exist. */
export async function importRedirects(text: string, viewer: Viewer) {
  const { rows, errors } = parseBulkRedirects(text);

  const existing = await prisma.redirect.findMany({
    where: { source: { in: rows.map((row) => row.source) } },
    select: { source: true },
  });
  const taken = new Set(existing.map((row) => row.source));

  const fresh = rows.filter((row) => !taken.has(row.source));
  if (fresh.length > 0) {
    await prisma.redirect.createMany({ data: fresh });
  }

  await recordAudit({
    actorId: viewer.id,
    action: "redirects.create",
    entity: "Redirect",
    summary: `Imported ${fresh.length} redirect(s)`,
  });
  revalidateContent(CACHE_TAGS.redirects);

  return { created: fresh.length, skipped: rows.length - fresh.length, errors };
}

/**
 * Walk the chain from `target` and refuse if it comes back to `source`.
 * A loop would make the destination unreachable and hang the browser on retries.
 */
async function assertNoLoop(source: string, target: string, exceptId?: string) {
  let cursor: string | null = target;
  const seen = new Set<string>([source]);

  for (let hops = 0; cursor && hops < 25; hops += 1) {
    if (seen.has(cursor)) {
      throw new ConflictError(`That would create a redirect loop via ${cursor}.`);
    }
    seen.add(cursor);

    const next: { id: string; target: string } | null = await prisma.redirect.findUnique({
      where: { source: cursor },
      select: { id: true, target: true },
    });
    if (!next || next.id === exceptId) break;
    cursor = next.target;
  }
}
