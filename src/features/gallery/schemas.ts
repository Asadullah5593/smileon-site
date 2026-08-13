import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";
import { orderedStatusSchema, type PublishStatus } from "@/shared/content/publishable";

export const galleryCreateSchema = z.object({
  title: z.string().trim().min(2, "Give the case a title.").max(200),
  description: z.string().max(2000).nullish(),
  beforeMediaId: z.string().nullish(),
  afterMediaId: z.string().nullish(),
  serviceId: z.string().nullish(),
  ...orderedStatusSchema.shape,
});

export const galleryUpdateSchema = galleryCreateSchema.partial();

export const galleryListQuerySchema = listQuerySchema.extend({
  serviceId: z.string().optional(),
});

export type GalleryCreateInput = z.output<typeof galleryCreateSchema>;
export type GalleryUpdateInput = z.output<typeof galleryUpdateSchema>;
export type GalleryFormValues = z.input<typeof galleryCreateSchema>;
export type GalleryListQuery = z.infer<typeof galleryListQuerySchema>;

export type GalleryCaseDto = {
  id: string;
  title: string;
  description: string | null;
  beforeMediaId: string | null;
  beforeUrl: string | null;
  afterMediaId: string | null;
  afterUrl: string | null;
  serviceId: string | null;
  serviceTitle: string | null;
  sortOrder: number;
  status: PublishStatus;
  updatedAt: string;
};
