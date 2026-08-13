import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";
import { blocksSchema, type PageBlock } from "@/features/pages/blocks";
import {
  pathSlugSchema,
  seoSchema,
  statusSchema,
  type PublishStatus,
} from "@/shared/content/publishable";

export const pageCreateSchema = z.object({
  title: z.string().trim().min(2, "Give the page a title.").max(200),
  slug: pathSlugSchema,
  excerpt: z.string().max(400).nullish(),
  bodyHtml: z.string().max(400_000).nullish(),
  /** Ordered sections rendered after `bodyHtml`. See `features/pages/blocks`. */
  blocks: blocksSchema,
  // `Page` has no sortOrder column — status + SEO only.
  ...statusSchema.shape,
  ...seoSchema.shape,
});

export const pageUpdateSchema = pageCreateSchema.partial();

export const pageListQuerySchema = listQuerySchema;

export type PageCreateInput = z.output<typeof pageCreateSchema>;
export type PageUpdateInput = z.output<typeof pageUpdateSchema>;
export type PageFormValues = z.input<typeof pageCreateSchema>;
export type PageListQuery = z.infer<typeof pageListQuerySchema>;

export type PageDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  bodyHtml: string | null;
  blocks: PageBlock[];
  status: PublishStatus;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageId: string | null;
  noIndex: boolean;
  updatedAt: string;
};
