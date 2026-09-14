import "server-only";
import { prisma } from "@/shared/db/prisma";
import { NotFoundError } from "@/shared/api/errors";
import { mediaUrl } from "@/shared/storage";
import { diffOf, recordAudit } from "@/shared/audit/audit-log";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import type { Viewer } from "@/shared/auth/permissions";
import type { BannerCreateInput, BannerDto, BannerUpdateInput } from "@/features/banners/schemas";
import type { Prisma } from "@/generated/prisma/client";

/** All `Banner` data access — the homepage hero. */

const withRelations = { media: { select: { key: true } } } satisfies Prisma.BannerInclude;

type BannerRow = Prisma.BannerGetPayload<{ include: typeof withRelations }>;

function toBannerDto(banner: BannerRow): BannerDto {
  return {
    id: banner.id,
    heading: banner.heading,
    subheading: banner.subheading,
    mediaId: banner.mediaId,
    mediaUrl: mediaUrl(banner.media?.key),
    ctaLabel: banner.ctaLabel,
    ctaHref: banner.ctaHref,
    sortOrder: banner.sortOrder,
    isActive: banner.isActive,
  };
}

export async function listBanners(): Promise<BannerDto[]> {
  const rows = await prisma.banner.findMany({
    include: withRelations,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toBannerDto);
}

/** Public read — only active banners reach the homepage. */
export async function listActiveBanners(): Promise<BannerDto[]> {
  const rows = await prisma.banner.findMany({
    where: { isActive: true },
    include: withRelations,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toBannerDto);
}

export async function getBannerById(id: string): Promise<BannerDto> {
  const banner = await prisma.banner.findUnique({ where: { id }, include: withRelations });
  if (!banner) throw new NotFoundError("Banner");
  return toBannerDto(banner);
}

export async function createBanner(input: BannerCreateInput, viewer: Viewer): Promise<BannerDto> {
  const banner = await prisma.banner.create({
    data: { ...toWriteData(input), heading: input.heading },
    include: withRelations,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "banners.create",
    entity: "Banner",
    entityId: banner.id,
    summary: banner.heading,
  });
  revalidateContent(CACHE_TAGS.banners);

  return toBannerDto(banner);
}

export async function updateBanner(
  id: string,
  input: BannerUpdateInput,
  viewer: Viewer,
): Promise<BannerDto> {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Banner");

  const banner = await prisma.banner.update({
    where: { id },
    data: toWriteData(input),
    include: withRelations,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "banners.update",
    entity: "Banner",
    entityId: id,
    summary: banner.heading,
    diff: diffOf(
      existing as unknown as Record<string, unknown>,
      banner as unknown as Record<string, unknown>,
    ),
  });
  revalidateContent(CACHE_TAGS.banners);

  return toBannerDto(banner);
}

export async function deleteBanner(id: string, viewer: Viewer) {
  const banner = await prisma.banner.delete({ where: { id } }).catch(() => null);
  if (!banner) throw new NotFoundError("Banner");

  await recordAudit({
    actorId: viewer.id,
    action: "banners.delete",
    entity: "Banner",
    entityId: id,
    summary: banner.heading,
  });
  revalidateContent(CACHE_TAGS.banners);
}

function toWriteData(input: BannerUpdateInput) {
  return {
    heading: input.heading,
    subheading: input.subheading ?? undefined,
    mediaId: input.mediaId ?? undefined,
    ctaLabel: input.ctaLabel ?? undefined,
    ctaHref: input.ctaHref ?? undefined,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  };
}
