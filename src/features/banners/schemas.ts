import { z } from "zod";

export const bannerCreateSchema = z.object({
  heading: z.string().trim().min(2, "Give the banner a heading.").max(200),
  subheading: z.string().max(500).nullish(),
  mediaId: z.string().nullish(),
  ctaLabel: z.string().trim().max(80).nullish(),
  ctaHref: z.string().trim().max(500).nullish(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export const bannerUpdateSchema = bannerCreateSchema.partial();

export type BannerCreateInput = z.output<typeof bannerCreateSchema>;
export type BannerUpdateInput = z.output<typeof bannerUpdateSchema>;
export type BannerFormValues = z.input<typeof bannerCreateSchema>;

export type BannerDto = {
  id: string;
  heading: string;
  subheading: string | null;
  mediaId: string | null;
  mediaUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isActive: boolean;
};
