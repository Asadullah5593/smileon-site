import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";

/** SEO block shared by every publishable resource. */
export const seoSchema = z.object({
  seoTitle: z.string().max(70).nullish(),
  seoDescription: z.string().max(180).nullish(),
  ogImageId: z.string().nullish(),
  noIndex: z.boolean().default(false),
});

export const serviceCreateSchema = z.object({
  title: z.string().trim().min(2, "Give the treatment a name.").max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and hyphens only.")
    .max(160)
    .optional(),
  summary: z.string().max(400).nullish(),
  bodyHtml: z.string().max(200_000).nullish(),
  icon: z.string().max(60).nullish(),
  imageId: z.string().nullish(),
  categoryId: z.string().nullish(),
  priceFrom: z.coerce.number().min(0).max(9_999_999).nullish(),
  duration: z.string().max(60).nullish(),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  ...seoSchema.shape,
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export const serviceListQuerySchema = listQuerySchema.extend({
  categoryId: z.string().optional(),
  featured: z.enum(["true", "false"]).optional(),
});

/** What the API receives after parsing (defaults applied, numbers coerced). */
export type ServiceCreateInput = z.output<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.output<typeof serviceUpdateSchema>;
/** What the form holds before parsing — defaults are still optional here. */
export type ServiceFormValues = z.input<typeof serviceCreateSchema>;
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;

export type ServiceDto = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  bodyHtml: string | null;
  icon: string | null;
  imageId: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  priceFrom: number | null;
  duration: string | null;
  isFeatured: boolean;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageId: string | null;
  noIndex: boolean;
  updatedAt: string;
};
