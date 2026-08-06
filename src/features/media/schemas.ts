import { z } from "zod";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
] as const;

export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  q: z.string().trim().max(200).optional(),
  folder: z.string().trim().max(100).optional(),
});

export const mediaUpdateSchema = z.object({
  alt: z.string().max(300).nullish(),
  caption: z.string().max(500).nullish(),
  folder: z.string().max(100).optional(),
});

export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;

export type MediaDto = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
  folder: string;
  createdAt: string;
};
