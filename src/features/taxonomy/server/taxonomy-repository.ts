import "server-only";
import { prisma } from "@/shared/db/prisma";
import { ConflictError, NotFoundError } from "@/shared/api/errors";
import { uniqueSlug } from "@/shared/utils/slug";
import { recordAudit } from "@/shared/audit/audit-log";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import type { Viewer } from "@/shared/auth/permissions";
import type {
  TaxonomyCreateInput,
  TaxonomyKind,
  TaxonomyListQuery,
  TaxonomyTermDto,
  TaxonomyUpdateInput,
} from "@/features/taxonomy/schemas";

/**
 * Post categories, post tags and service categories. Three tables, one
 * permission, one repository — they are the same idea with different columns.
 *
 * `Tag` has no `description` or `sortOrder`; the DTO reports null / 0 for it
 * and writes to those fields are ignored rather than erroring, so one form
 * serves all three.
 */

const delegates = {
  category: prisma.category,
  tag: prisma.tag,
  serviceCategory: prisma.serviceCategory,
} as const;

const supportsDescription = (kind: TaxonomyKind) => kind !== "tag";

function toDto(
  kind: TaxonomyKind,
  row: Record<string, unknown>,
  usageCount: number,
): TaxonomyTermDto {
  return {
    id: String(row.id),
    kind,
    name: String(row.name),
    slug: String(row.slug),
    description: typeof row.description === "string" ? row.description : null,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
    usageCount,
  };
}

/** How many records reference each term, so the UI can block deleting one in use. */
async function usageCounts(kind: TaxonomyKind, ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();

  if (kind === "category") {
    const rows = await prisma.postCategory.groupBy({
      by: ["categoryId"],
      where: { categoryId: { in: ids } },
      _count: { postId: true },
    });
    return new Map(rows.map((row) => [row.categoryId, row._count.postId]));
  }

  if (kind === "tag") {
    const rows = await prisma.postTag.groupBy({
      by: ["tagId"],
      where: { tagId: { in: ids } },
      _count: { postId: true },
    });
    return new Map(rows.map((row) => [row.tagId, row._count.postId]));
  }

  const rows = await prisma.service.groupBy({
    by: ["categoryId"],
    where: { categoryId: { in: ids } },
    _count: { id: true },
  });
  return new Map(
    rows.flatMap((row) => (row.categoryId ? [[row.categoryId, row._count.id] as const] : [])),
  );
}

export async function listTaxonomy(query: TaxonomyListQuery): Promise<TaxonomyTermDto[]> {
  const { kind, q } = query;

  const rows = (await (delegates[kind] as typeof prisma.category).findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: supportsDescription(kind) ? [{ sortOrder: "asc" }, { name: "asc" }] : { name: "asc" },
  })) as unknown as Record<string, unknown>[];

  const counts = await usageCounts(
    kind,
    rows.map((row) => String(row.id)),
  );

  return rows.map((row) => toDto(kind, row, counts.get(String(row.id)) ?? 0));
}

export async function createTaxonomyTerm(
  input: TaxonomyCreateInput,
  viewer: Viewer,
): Promise<TaxonomyTermDto> {
  const { kind } = input;
  const slug = await uniqueSlug(input.slug || input.name, (candidate) =>
    slugTaken(kind, candidate),
  );

  const row = (await (delegates[kind] as typeof prisma.category).create({
    data: {
      name: input.name,
      slug,
      ...(supportsDescription(kind)
        ? { description: input.description ?? null, sortOrder: input.sortOrder }
        : {}),
    },
  })) as unknown as Record<string, unknown>;

  await recordAudit({
    actorId: viewer.id,
    action: "taxonomy.create",
    entity: kind,
    entityId: String(row.id),
    summary: input.name,
  });
  revalidateContent(CACHE_TAGS.taxonomy, CACHE_TAGS.posts, CACHE_TAGS.services);

  return toDto(kind, row, 0);
}

export async function updateTaxonomyTerm(
  id: string,
  input: TaxonomyUpdateInput,
  viewer: Viewer,
): Promise<TaxonomyTermDto> {
  const { kind } = input;
  const delegate = delegates[kind] as typeof prisma.category;

  const existing = (await delegate.findUnique({ where: { id } })) as unknown as Record<
    string,
    unknown
  > | null;
  if (!existing) throw new NotFoundError("Term");

  const slug =
    input.slug && input.slug !== existing.slug
      ? await uniqueSlug(input.slug, (candidate) => slugTaken(kind, candidate, id))
      : undefined;

  const row = (await delegate.update({
    where: { id },
    data: {
      name: input.name,
      ...(slug ? { slug } : {}),
      ...(supportsDescription(kind)
        ? { description: input.description ?? undefined, sortOrder: input.sortOrder }
        : {}),
    },
  })) as unknown as Record<string, unknown>;

  await recordAudit({
    actorId: viewer.id,
    action: "taxonomy.update",
    entity: kind,
    entityId: id,
    summary: String(row.name),
  });
  revalidateContent(CACHE_TAGS.taxonomy, CACHE_TAGS.posts, CACHE_TAGS.services);

  const counts = await usageCounts(kind, [id]);
  return toDto(kind, row, counts.get(id) ?? 0);
}

export async function deleteTaxonomyTerm(id: string, kind: TaxonomyKind, viewer: Viewer) {
  // Deleting a term in use would silently strip it from published content.
  const counts = await usageCounts(kind, [id]);
  const inUse = counts.get(id) ?? 0;
  if (inUse > 0) {
    throw new ConflictError(
      `${inUse} record(s) still use this term. Reassign them before deleting it.`,
    );
  }

  const row = (await (delegates[kind] as typeof prisma.category)
    .delete({ where: { id } })
    .catch(() => null)) as unknown as Record<string, unknown> | null;
  if (!row) throw new NotFoundError("Term");

  await recordAudit({
    actorId: viewer.id,
    action: "taxonomy.delete",
    entity: kind,
    entityId: id,
    summary: String(row.name),
  });
  revalidateContent(CACHE_TAGS.taxonomy, CACHE_TAGS.posts, CACHE_TAGS.services);
}

async function slugTaken(kind: TaxonomyKind, slug: string, exceptId?: string) {
  const found = (await (delegates[kind] as typeof prisma.category).findUnique({
    where: { slug },
    select: { id: true },
  })) as { id: string } | null;
  return Boolean(found && found.id !== exceptId);
}
