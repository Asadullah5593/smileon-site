import { z } from "zod";
import { slugSchema } from "@/shared/content/publishable";

/**
 * Three small tables share the `taxonomy.*` permission: post categories, post
 * tags, and service categories. They differ only in which fields they carry,
 * so one schema pair with a `kind` discriminator keeps the API to two routes
 * instead of six.
 */
export const TAXONOMY_KINDS = ["category", "tag", "serviceCategory"] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

export const taxonomyKindSchema = z.enum(TAXONOMY_KINDS);

export const taxonomyCreateSchema = z.object({
  kind: taxonomyKindSchema,
  name: z.string().trim().min(2, "Give it a name.").max(120),
  slug: slugSchema,
  description: z.string().max(500).nullish(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

/** `kind` is required on update too — it selects the table. */
export const taxonomyUpdateSchema = z.object({
  kind: taxonomyKindSchema,
  name: z.string().trim().min(2).max(120).optional(),
  slug: slugSchema,
  description: z.string().max(500).nullish(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export const taxonomyListQuerySchema = z.object({
  kind: taxonomyKindSchema,
  q: z.string().trim().max(200).optional(),
});

export type TaxonomyCreateInput = z.output<typeof taxonomyCreateSchema>;
export type TaxonomyUpdateInput = z.output<typeof taxonomyUpdateSchema>;
export type TaxonomyFormValues = z.input<typeof taxonomyCreateSchema>;
export type TaxonomyListQuery = z.infer<typeof taxonomyListQuerySchema>;

export type TaxonomyTermDto = {
  id: string;
  kind: TaxonomyKind;
  name: string;
  slug: string;
  /** Tags carry no description; the field is simply null for them. */
  description: string | null;
  sortOrder: number;
  /** How many records use this term — a term in use cannot be deleted. */
  usageCount: number;
};

export const TAXONOMY_LABELS: Record<TaxonomyKind, { singular: string; plural: string }> = {
  category: { singular: "Blog category", plural: "Blog categories" },
  tag: { singular: "Tag", plural: "Tags" },
  serviceCategory: { singular: "Treatment category", plural: "Treatment categories" },
};
