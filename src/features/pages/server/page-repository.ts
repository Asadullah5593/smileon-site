import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { NotFoundError, ValidationError } from "@/shared/api/errors";
import { slugifyPath, uniqueSlug } from "@/shared/utils/slug";
import { sanitizeHtml } from "@/shared/editor/sanitize";
import { diffOf, recordAudit } from "@/shared/audit/audit-log";
import { assertCanSetStatus } from "@/shared/auth/publish-guard";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import {
  isReservedSlug,
  publishedAtOnCreate,
  publishedAtOnUpdate,
} from "@/shared/content/publishable";
import type { Viewer } from "@/shared/auth/permissions";
import type {
  PageCreateInput,
  PageDto,
  PageListQuery,
  PageUpdateInput,
} from "@/features/pages/schemas";
import { parseBlocks, type PageBlock } from "@/features/pages/blocks";
import type { Page, Prisma } from "@/generated/prisma/client";

/** All `Page` data access. Pages render at `/[...slug]` on the public site. */

function toPageDto(page: Page): PageDto {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    excerpt: page.excerpt,
    bodyHtml: page.bodyHtml,
    blocks: parseBlocks(page.blocks),
    status: page.status,
    publishedAt: page.publishedAt?.toISOString() ?? null,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    ogImageId: page.ogImageId,
    noIndex: page.noIndex,
    updatedAt: page.updatedAt.toISOString(),
  };
}

const SORTABLE = ["title", "updatedAt", "createdAt", "status"] as const;

export async function listPages(query: PageListQuery) {
  const where: Prisma.PageWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q ? { OR: [{ title: { contains: query.q } }, { slug: { contains: query.q } }] } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.page.findMany({
      where,
      orderBy: toOrderBy(query, SORTABLE, { updatedAt: "desc" }),
      ...toSkipTake(query),
    }),
    prisma.page.count({ where }),
  ]);

  return paginate(rows.map(toPageDto), total, query.page, query.pageSize);
}

export async function getPageById(id: string): Promise<PageDto> {
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) throw new NotFoundError("Page");
  return toPageDto(page);
}

/** Public read — only ever returns published rows. */
export async function getPublishedPageBySlug(slug: string) {
  const page = await prisma.page.findFirst({ where: { slug, status: "PUBLISHED" } });
  return page ? toPageDto(page) : null;
}

export async function listPublishedPageSlugs() {
  return prisma.page.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
}

export async function createPage(input: PageCreateInput, viewer: Viewer): Promise<PageDto> {
  assertCanSetStatus(viewer, "pages", input.status);

  const slug = await uniqueSlug(input.slug || input.title, slugTaken, slugifyPath);
  assertNotReserved(slug);

  const page = await prisma.page.create({
    data: {
      ...toWriteData(input),
      title: input.title,
      slug,
      publishedAt: publishedAtOnCreate(input.status),
    },
  });

  await recordAudit({
    actorId: viewer.id,
    action: "pages.create",
    entity: "Page",
    entityId: page.id,
    summary: page.title,
  });
  revalidateContent(CACHE_TAGS.pages);

  return toPageDto(page);
}

export async function updatePage(
  id: string,
  input: PageUpdateInput,
  viewer: Viewer,
): Promise<PageDto> {
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Page");

  assertCanSetStatus(viewer, "pages", input.status, existing.status);

  let slug: string | undefined;
  if (input.slug && input.slug !== existing.slug) {
    slug = await uniqueSlug(input.slug, (candidate) => slugTaken(candidate, id), slugifyPath);
    assertNotReserved(slug);
  }

  const page = await prisma.page.update({
    where: { id },
    data: {
      ...toWriteData(input),
      ...(slug ? { slug } : {}),
      ...publishedAtOnUpdate(input.status, existing),
    },
  });

  await recordAudit({
    actorId: viewer.id,
    action: "pages.update",
    entity: "Page",
    entityId: id,
    summary: page.title,
    diff: diffOf(
      existing as unknown as Record<string, unknown>,
      page as unknown as Record<string, unknown>,
    ),
  });
  revalidateContent(CACHE_TAGS.pages);

  return toPageDto(page);
}

export async function deletePage(id: string, viewer: Viewer) {
  const page = await prisma.page.delete({ where: { id } }).catch(() => null);
  if (!page) throw new NotFoundError("Page");

  await recordAudit({
    actorId: viewer.id,
    action: "pages.delete",
    entity: "Page",
    entityId: id,
    summary: page.title,
  });
  revalidateContent(CACHE_TAGS.pages);
}

/**
 * A page slugged `services` would never render — the real route wins — so
 * reject it here rather than let someone publish an unreachable page.
 */
function assertNotReserved(slug: string) {
  if (isReservedSlug(slug)) {
    throw new ValidationError(
      { slug: "reserved" },
      `“${slug.split("/")[0]}” is used by the website itself. Choose a different address.`,
    );
  }
}

/**
 * Rich-text blocks carry editor HTML, so they are sanitised on write exactly
 * like `bodyHtml` — the renderer trusts whatever is in the column.
 */
function sanitizeBlocks(blocks: PageBlock[]): PageBlock[] {
  return blocks.map((block) =>
    block.type === "richText" ? { ...block, html: sanitizeHtml(block.html) } : block,
  );
}

function toWriteData(input: PageUpdateInput) {
  return {
    title: input.title,
    excerpt: input.excerpt ?? undefined,
    bodyHtml: input.bodyHtml === undefined ? undefined : sanitizeHtml(input.bodyHtml ?? ""),
    blocks: input.blocks === undefined ? undefined : sanitizeBlocks(input.blocks),
    status: input.status,
    seoTitle: input.seoTitle ?? undefined,
    seoDescription: input.seoDescription ?? undefined,
    ogImageId: input.ogImageId ?? undefined,
    noIndex: input.noIndex,
  };
}

async function slugTaken(slug: string, exceptId?: string) {
  const found = await prisma.page.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(found && found.id !== exceptId);
}
