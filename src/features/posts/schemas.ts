import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";
import {
  seoSchema,
  slugSchema,
  statusSchema,
  type PublishStatus,
} from "@/shared/content/publishable";

export const postCreateSchema = z.object({
  title: z.string().trim().min(2, "Give the post a title.").max(200),
  slug: slugSchema,
  excerpt: z.string().max(400).nullish(),
  bodyHtml: z.string().max(400_000).nullish(),
  coverId: z.string().nullish(),
  categoryIds: z.array(z.string()).max(10).default([]),
  tagIds: z.array(z.string()).max(20).default([]),
  // `Post` has no sortOrder column — the blog orders by publish date.
  ...statusSchema.shape,
  ...seoSchema.shape,
});

export const postUpdateSchema = postCreateSchema.partial();

export const postListQuerySchema = listQuerySchema.extend({
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  authorId: z.string().optional(),
});

export type PostCreateInput = z.output<typeof postCreateSchema>;
export type PostUpdateInput = z.output<typeof postUpdateSchema>;
export type PostFormValues = z.input<typeof postCreateSchema>;
export type PostListQuery = z.infer<typeof postListQuerySchema>;

export type PostDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  bodyHtml: string | null;
  coverId: string | null;
  coverUrl: string | null;
  authorId: string | null;
  authorName: string | null;
  categoryIds: string[];
  categoryNames: string[];
  tagIds: string[];
  tagNames: string[];
  readMinutes: number | null;
  status: PublishStatus;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageId: string | null;
  noIndex: boolean;
  updatedAt: string;
};
