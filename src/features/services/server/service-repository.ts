import "server-only";
import { revalidateTag } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { NotFoundError } from "@/shared/api/errors";
import { mediaUrl } from "@/shared/storage";
import { uniqueSlug } from "@/shared/utils/slug";
import { sanitizeHtml } from "@/shared/editor/sanitize";
import { diffOf, recordAudit } from "@/shared/audit/audit-log";
import type {
  ServiceCreateInput,
  ServiceDto,
  ServiceListQuery,
  ServiceUpdateInput,
} from "@/features/services/schemas";
import type { Prisma } from "@/generated/prisma/client";

/**
 * All Service data access lives here — nothing outside this file talks to
 * `prisma.service` directly. That boundary is what keeps a future move to a
 * standalone API a swap of this module rather than a rewrite.
 */

export const SERVICES_CACHE_TAG = "services";

const withRelations = {
  image: true,
  category: { select: { id: true, name: true } },
} satisfies Prisma.ServiceInclude;

type ServiceRow = Prisma.ServiceGetPayload<{ include: typeof withRelations }>;

export function toServiceDto(service: ServiceRow): ServiceDto {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    summary: service.summary,
    bodyHtml: service.bodyHtml,
    icon: service.icon,
    imageId: service.imageId,
    imageUrl: mediaUrl(service.image?.key),
    categoryId: service.categoryId,
    categoryName: service.category?.name ?? null,
    priceFrom: service.priceFrom ? Number(service.priceFrom) : null,
    duration: service.duration,
    isFeatured: service.isFeatured,
    sortOrder: service.sortOrder,
    status: service.status,
    publishedAt: service.publishedAt?.toISOString() ?? null,
    seoTitle: service.seoTitle,
    seoDescription: service.seoDescription,
    ogImageId: service.ogImageId,
    noIndex: service.noIndex,
    updatedAt: service.updatedAt.toISOString(),
  };
}

const SORTABLE = ["title", "sortOrder", "updatedAt", "createdAt", "status"] as const;

export async function listServices(query: ServiceListQuery) {
  const where: Prisma.ServiceWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.featured ? { isFeatured: query.featured === "true" } : {}),
    ...(query.q
      ? { OR: [{ title: { contains: query.q } }, { summary: { contains: query.q } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: withRelations,
      orderBy: toOrderBy(query, SORTABLE, { updatedAt: "desc" }),
      ...toSkipTake(query),
    }),
    prisma.service.count({ where }),
  ]);

  return paginate(rows.map(toServiceDto), total, query.page, query.pageSize);
}

export async function getServiceById(id: string) {
  const service = await prisma.service.findUnique({ where: { id }, include: withRelations });
  if (!service) throw new NotFoundError("Service");
  return toServiceDto(service);
}

/** Public read — only ever returns published rows. */
export async function getPublishedServiceBySlug(slug: string) {
  const service = await prisma.service.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: withRelations,
  });
  return service ? toServiceDto(service) : null;
}

export async function listPublishedServices(options: { featuredOnly?: boolean; limit?: number } = {}) {
  const rows = await prisma.service.findMany({
    where: {
      status: "PUBLISHED",
      ...(options.featuredOnly ? { isFeatured: true } : {}),
    },
    include: withRelations,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    take: options.limit,
  });
  return rows.map(toServiceDto);
}

export async function createService(input: ServiceCreateInput, actorId: string) {
  const slug = await uniqueSlug(input.slug || input.title, slugTaken);

  const service = await prisma.service.create({
    data: {
      ...toWriteData(input),
      title: input.title,
      slug,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    },
    include: withRelations,
  });

  await recordAudit({
    actorId,
    action: "services.create",
    entity: "Service",
    entityId: service.id,
    summary: service.title,
  });
  invalidate();

  return toServiceDto(service);
}

export async function updateService(id: string, input: ServiceUpdateInput, actorId: string) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Service");

  const slug =
    input.slug && input.slug !== existing.slug
      ? await uniqueSlug(input.slug, (candidate) => slugTaken(candidate, id))
      : undefined;

  // Stamp publishedAt the first time a draft goes live; keep the original date
  // on subsequent edits so "published on" doesn't jump around.
  const goingLive = input.status === "PUBLISHED" && existing.status !== "PUBLISHED";

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...toWriteData(input),
      ...(slug ? { slug } : {}),
      ...(goingLive ? { publishedAt: existing.publishedAt ?? new Date() } : {}),
    },
    include: withRelations,
  });

  await recordAudit({
    actorId,
    action: "services.update",
    entity: "Service",
    entityId: id,
    summary: service.title,
    diff: diffOf(existing as unknown as Record<string, unknown>, service as unknown as Record<string, unknown>),
  });
  invalidate();

  return toServiceDto(service);
}

export async function setServiceStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  actorId: string,
) {
  return updateService(id, { status }, actorId);
}

export async function deleteService(id: string, actorId: string) {
  const service = await prisma.service.delete({ where: { id } });

  await recordAudit({
    actorId,
    action: "services.delete",
    entity: "Service",
    entityId: id,
    summary: service.title,
  });
  invalidate();
}

function toWriteData(input: ServiceUpdateInput) {
  return {
    title: input.title,
    summary: input.summary ?? undefined,
    bodyHtml: input.bodyHtml === undefined ? undefined : sanitizeHtml(input.bodyHtml ?? ""),
    icon: input.icon ?? undefined,
    imageId: input.imageId ?? undefined,
    categoryId: input.categoryId ?? undefined,
    priceFrom: input.priceFrom ?? undefined,
    duration: input.duration ?? undefined,
    isFeatured: input.isFeatured,
    sortOrder: input.sortOrder,
    status: input.status,
    seoTitle: input.seoTitle ?? undefined,
    seoDescription: input.seoDescription ?? undefined,
    ogImageId: input.ogImageId ?? undefined,
    noIndex: input.noIndex,
  };
}

async function slugTaken(slug: string, exceptId?: string) {
  const found = await prisma.service.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(found && found.id !== exceptId);
}

/** Drop the cached public pages so an edit is live immediately. */
function invalidate() {
  revalidateTag(SERVICES_CACHE_TAG, "max");
}
