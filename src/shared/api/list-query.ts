import { z } from "zod";

/** Shared shape for every paginated admin list endpoint. */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  sort: z.string().max(50).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export function toSkipTake({ page, pageSize }: Pick<ListQuery, "page" | "pageSize">) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

/**
 * Translate `sort`/`order` into a Prisma `orderBy`, ignoring column names that
 * aren't explicitly allow-listed by the caller.
 */
export function toOrderBy<T extends string>(
  { sort, order }: Pick<ListQuery, "sort" | "order">,
  allowed: readonly T[],
  fallback: Record<string, "asc" | "desc">,
): Record<string, "asc" | "desc"> {
  if (sort && (allowed as readonly string[]).includes(sort)) return { [sort]: order };
  return fallback;
}
