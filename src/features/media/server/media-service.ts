import "server-only";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "@/shared/db/prisma";
import { storage, mediaUrl } from "@/shared/storage";
import { ValidationError, NotFoundError } from "@/shared/api/errors";
import { paginate } from "@/shared/api/response";
import { slugify } from "@/shared/utils/slug";
import { recordAudit } from "@/shared/audit/audit-log";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  type MediaDto,
  type MediaListQuery,
  type MediaUpdateInput,
} from "@/features/media/schemas";
import type { Media } from "@/generated/prisma/client";

const THUMBNAIL_WIDTH = 400;

export function toMediaDto(media: Media): MediaDto {
  return {
    id: media.id,
    url: mediaUrl(media.key)!,
    thumbnailUrl: mediaUrl(media.thumbnailKey),
    originalName: media.originalName,
    mimeType: media.mimeType,
    size: media.size,
    width: media.width,
    height: media.height,
    alt: media.alt,
    caption: media.caption,
    folder: media.folder,
    createdAt: media.createdAt.toISOString(),
  };
}

/**
 * Store an uploaded file and its thumbnail, then record it in the library.
 * Raster images are re-encoded to WebP — that strips EXIF (including GPS from
 * phone photos) and typically halves the bytes served.
 */
export async function uploadMedia(file: File, options: { folder?: string; userId: string }) {
  if (file.size === 0) throw new ValidationError({ file: "empty" }, "The uploaded file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ValidationError(
      { file: "too_large", maxBytes: MAX_UPLOAD_BYTES },
      `Files must be ${MAX_UPLOAD_BYTES / 1024 / 1024} MB or smaller.`,
    );
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new ValidationError(
      { file: "unsupported_type", received: file.type },
      `Unsupported file type: ${file.type || "unknown"}.`,
    );
  }

  const folder = slugify(options.folder ?? "uploads") || "uploads";
  const now = new Date();
  const prefix = `${folder}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const stem = `${slugify(path.parse(file.name).name).slice(0, 60) || "file"}-${randomUUID().slice(0, 8)}`;

  const input = Buffer.from(await file.arrayBuffer());
  const isRaster = file.type.startsWith("image/") && file.type !== "image/svg+xml";

  let key: string;
  let thumbnailKey: string | null = null;
  let width: number | null = null;
  let height: number | null = null;
  let mimeType = file.type;
  let stored;

  if (isRaster) {
    const image = sharp(input, { animated: file.type === "image/gif" });
    const metadata = await image.metadata();
    width = metadata.width ?? null;
    height = metadata.height ?? null;
    mimeType = "image/webp";

    key = `${prefix}/${stem}.webp`;
    stored = await storage.put(key, await image.webp({ quality: 82 }).toBuffer(), mimeType);

    thumbnailKey = `${prefix}/${stem}-thumb.webp`;
    await storage.put(
      thumbnailKey,
      await sharp(input).resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer(),
      mimeType,
    );
  } else {
    key = `${prefix}/${stem}${path.parse(file.name).ext || ""}`;
    stored = await storage.put(key, input, file.type);
  }

  const media = await prisma.media.create({
    data: {
      key,
      thumbnailKey,
      originalName: file.name,
      mimeType,
      size: stored.size,
      width,
      height,
      folder,
      uploadedById: options.userId,
    },
  });

  await recordAudit({
    actorId: options.userId,
    action: "media.upload",
    entity: "Media",
    entityId: media.id,
    summary: media.originalName,
  });

  return toMediaDto(media);
}

export async function listMedia(query: MediaListQuery) {
  const where = {
    ...(query.folder ? { folder: query.folder } : {}),
    ...(query.q
      ? { OR: [{ originalName: { contains: query.q } }, { alt: { contains: query.q } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.media.count({ where }),
  ]);

  return paginate(items.map(toMediaDto), total, query.page, query.pageSize);
}

export async function updateMedia(id: string, input: MediaUpdateInput, actorId: string) {
  const media = await prisma.media.update({
    where: { id },
    data: {
      alt: input.alt ?? undefined,
      caption: input.caption ?? undefined,
      folder: input.folder,
    },
  });

  await recordAudit({
    actorId,
    action: "media.update",
    entity: "Media",
    entityId: id,
    summary: media.originalName,
  });

  return toMediaDto(media);
}

/**
 * Delete a file from storage and the library. Relations use `onDelete: SetNull`,
 * so content that referenced it keeps working with an empty image slot rather
 * than disappearing.
 */
export async function deleteMedia(id: string, actorId: string) {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new NotFoundError("Media");

  await prisma.media.delete({ where: { id } });
  await storage.delete(media.key);
  if (media.thumbnailKey) await storage.delete(media.thumbnailKey);

  await recordAudit({
    actorId,
    action: "media.delete",
    entity: "Media",
    entityId: id,
    summary: media.originalName,
  });
}
