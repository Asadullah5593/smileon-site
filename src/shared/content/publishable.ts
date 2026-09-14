import { z } from "zod";

/**
 * The fields every publishable content type shares — status, ordering and the
 * four SEO columns — plus the `publishedAt` stamping rules.
 *
 * Spread `publishableSchema.shape` into a resource's create schema rather than
 * re-declaring these; the matching UI lives in `shared/content/PublishingCard`
 * and `SeoCard`.
 */

export const PUBLISH_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

/** SEO block shared by every publishable resource. */
export const seoSchema = z.object({
  seoTitle: z.string().max(70).nullish(),
  seoDescription: z.string().max(180).nullish(),
  ogImageId: z.string().nullish(),
  noIndex: z.boolean().default(false),
});

/** Slug rules shared by every resource with a public URL. */
export const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and hyphens only.")
  .max(160)
  .optional();

/**
 * The three composable blocks. Which ones a resource spreads depends on the
 * columns its model actually has — not every publishable type is orderable,
 * and not every one has a URL of its own:
 *
 *   services              status + sortOrder + seo   (`publishableSchema`)
 *   pages, posts          status + seo               (no sortOrder column)
 *   faqs, testimonials,
 *   team, gallery         status + sortOrder         (`orderedStatusSchema`)
 */
export const statusSchema = z.object({
  status: z.enum(PUBLISH_STATUSES).default("DRAFT"),
});

export const orderedStatusSchema = z.object({
  ...statusSchema.shape,
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

/** The above plus SEO, for content with its own URL: services, pages, posts. */
/**
 * Slug for CMS pages, which may be nested (`about/our-values`). Segments follow
 * the same rules as `slugSchema`; a leading or trailing slash is rejected so
 * the stored value maps 1:1 onto the URL path.
 */
export const pathSlugSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/,
    "Use lowercase letters, numbers and hyphens, with / between segments.",
  )
  .max(200)
  .optional();

/**
 * Top-level route segments a page slug must not collide with, because a real
 * route already owns them and would always win.
 */
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "login",
  "services",
  "blog",
  "team",
  "gallery",
  "faqs",
  "contact",
  "sitemap.xml",
  "robots.txt",
] as const;

export function isReservedSlug(slug: string): boolean {
  const [first] = slug.split("/");
  return (RESERVED_SLUGS as readonly string[]).includes(first);
}

export const publishableSchema = z.object({
  ...orderedStatusSchema.shape,
  ...seoSchema.shape,
});

/** `publishedAt` for a newly created record. */
export function publishedAtOnCreate(status: PublishStatus | undefined): Date | null {
  return status === "PUBLISHED" ? new Date() : null;
}

/**
 * `publishedAt` for an update, as a spreadable patch.
 *
 * Stamped the first time a draft goes live and never rewritten afterwards, so
 * "published on" doesn't jump around every time someone fixes a typo.
 */
export function publishedAtOnUpdate(
  next: PublishStatus | undefined,
  existing: { status: PublishStatus; publishedAt: Date | null },
): { publishedAt?: Date } {
  const goingLive = next === "PUBLISHED" && existing.status !== "PUBLISHED";
  return goingLive ? { publishedAt: existing.publishedAt ?? new Date() } : {};
}
