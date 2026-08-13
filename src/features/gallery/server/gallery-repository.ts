import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { NotFoundError, ValidationError } from "@/shared/api/errors";
import { mediaUrl } from "@/shared/storage";
import { diffOf, recordAudit } from "@/shared/audit/audit-log";
import { assertCanSetStatus } from "@/shared/auth/publish-guard";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import type { Viewer } from "@/shared/auth/permissions";
import type {
  GalleryCaseDto,
  GalleryCreateInput,
  GalleryListQuery,
  GalleryUpdateInput,
} from "@/features/gallery/schemas";
import type { Prisma } from "@/generated/prisma/client";

/** All `GalleryCase` data access — the before/after showcase. */

const withRelations = {
  beforeMedia: { select: { key: true } },
  afterMedia: { select: { key: true } },
  service: { select: { title: true } },
} satisfies Prisma.GalleryCaseInclude;

type GalleryRow = Prisma.GalleryCaseGetPayload<{ include: typeof withRelations }>;

function toGalleryCaseDto(row: GalleryRow): GalleryCaseDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    beforeMediaId: row.beforeMediaId,
    beforeUrl: mediaUrl(row.beforeMedia?.key),
    afterMediaId: row.afterMediaId,
    afterUrl: mediaUrl(row.afterMedia?.key),
    serviceId: row.serviceId,
    serviceTitle: row.service?.title ?? null,
    sortOrder: row.sortOrder,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * A before/after case with only one of the pair is not a case — it is a photo.
 * Guard it at publish time rather than letting a half-populated card reach the
 * website.
 */
function assertPairComplete(before: string | null | undefined, after: string | null | undefined) {
  if (!before || !after) {
    throw new ValidationError(
      {
        beforeMediaId: !before ? "required" : undefined,
        afterMediaId: !after ? "required" : undefined,
      },
      "A published case needs both a before and an after image.",
    );
  }
}

const SORTABLE = ["title", "sortOrder", "createdAt", "updatedAt", "status"] as const;

export async function listGalleryCases(query: GalleryListQuery) {
  const where: Prisma.GalleryCaseWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.serviceId ? { serviceId: query.serviceId } : {}),
    ...(query.q
      ? { OR: [{ title: { contains: query.q } }, { description: { contains: query.q } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.galleryCase.findMany({
      where,
      include: withRelations,
      orderBy: toOrderBy(query, SORTABLE, { sortOrder: "asc" }),
      ...toSkipTake(query),
    }),
    prisma.galleryCase.count({ where }),
  ]);

  return paginate(rows.map(toGalleryCaseDto), total, query.page, query.pageSize);
}

export async function getGalleryCaseById(id: string): Promise<GalleryCaseDto> {
  const row = await prisma.galleryCase.findUnique({ where: { id }, include: withRelations });
  if (!row) throw new NotFoundError("Gallery case");
  return toGalleryCaseDto(row);
}

export async function createGalleryCase(
  input: GalleryCreateInput,
  viewer: Viewer,
): Promise<GalleryCaseDto> {
  assertCanSetStatus(viewer, "gallery", input.status);
  if (input.status === "PUBLISHED") assertPairComplete(input.beforeMediaId, input.afterMediaId);

  const row = await prisma.galleryCase.create({
    data: { ...toWriteData(input), title: input.title },
    include: withRelations,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "gallery.create",
    entity: "GalleryCase",
    entityId: row.id,
    summary: row.title,
  });
  revalidateContent(CACHE_TAGS.gallery);

  return toGalleryCaseDto(row);
}

export async function updateGalleryCase(
  id: string,
  input: GalleryUpdateInput,
  viewer: Viewer,
): Promise<GalleryCaseDto> {
  const existing = await prisma.galleryCase.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Gallery case");

  assertCanSetStatus(viewer, "gallery", input.status, existing.status);

  const nextStatus = input.status ?? existing.status;
  if (nextStatus === "PUBLISHED") {
    assertPairComplete(
      input.beforeMediaId === undefined ? existing.beforeMediaId : input.beforeMediaId,
      input.afterMediaId === undefined ? existing.afterMediaId : input.afterMediaId,
    );
  }

  const row = await prisma.galleryCase.update({
    where: { id },
    data: toWriteData(input),
    include: withRelations,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "gallery.update",
    entity: "GalleryCase",
    entityId: id,
    summary: row.title,
    diff: diffOf(
      existing as unknown as Record<string, unknown>,
      row as unknown as Record<string, unknown>,
    ),
  });
  revalidateContent(CACHE_TAGS.gallery);

  return toGalleryCaseDto(row);
}

export async function deleteGalleryCase(id: string, viewer: Viewer) {
  const row = await prisma.galleryCase.delete({ where: { id } }).catch(() => null);
  if (!row) throw new NotFoundError("Gallery case");

  await recordAudit({
    actorId: viewer.id,
    action: "gallery.delete",
    entity: "GalleryCase",
    entityId: id,
    summary: row.title,
  });
  revalidateContent(CACHE_TAGS.gallery);
}

function toWriteData(input: GalleryUpdateInput) {
  return {
    title: input.title,
    description: input.description ?? undefined,
    beforeMediaId: input.beforeMediaId ?? undefined,
    afterMediaId: input.afterMediaId ?? undefined,
    serviceId: input.serviceId ?? undefined,
    sortOrder: input.sortOrder,
    status: input.status,
  };
}
