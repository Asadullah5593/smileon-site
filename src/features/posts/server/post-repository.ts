import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { NotFoundError } from "@/shared/api/errors";
import { mediaUrl } from "@/shared/storage";
import { uniqueSlug } from "@/shared/utils/slug";
import { htmlToText, sanitizeHtml } from "@/shared/editor/sanitize";
import { diffOf, recordAudit } from "@/shared/audit/audit-log";
import { assertCanSetStatus } from "@/shared/auth/publish-guard";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import { publishedAtOnCreate, publishedAtOnUpdate } from "@/shared/content/publishable";
import type { Viewer } from "@/shared/auth/permissions";
import type {
  PostCreateInput,
  PostDto,
  PostListQuery,
  PostUpdateInput,
} from "@/features/posts/schemas";
import type { Prisma } from "@/generated/prisma/client";

/** All `Post` data access, including its category and tag join tables. */

const withRelations = {
  cover: { select: { key: true } },
  author: { select: { name: true } },
  categories: { select: { category: { select: { id: true, name: true } } } },
  tags: { select: { tag: { select: { id: true, name: true } } } },
} satisfies Prisma.PostInclude;

type PostRow = Prisma.PostGetPayload<{ include: typeof withRelations }>;

/** Average adult reading speed; good enough for a "5 min read" label. */
const WORDS_PER_MINUTE = 200;

function readMinutesOf(bodyHtml: string | null | undefined): number | null {
  if (!bodyHtml) return null;
  // `htmlToText` truncates to 200 chars by default — pass the full length, or
  // every post reads as "1 min".
  const words = htmlToText(bodyHtml, bodyHtml.length).split(/\s+/).filter(Boolean).length;
  return words === 0 ? null : Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function toPostDto(post: PostRow): PostDto {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    bodyHtml: post.bodyHtml,
    coverId: post.coverId,
    coverUrl: mediaUrl(post.cover?.key),
    authorId: post.authorId,
    authorName: post.author?.name ?? null,
    categoryIds: post.categories.map((c) => c.category.id),
    categoryNames: post.categories.map((c) => c.category.name),
    tagIds: post.tags.map((t) => t.tag.id),
    tagNames: post.tags.map((t) => t.tag.name),
    readMinutes: post.readMinutes,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    ogImageId: post.ogImageId,
    noIndex: post.noIndex,
    updatedAt: post.updatedAt.toISOString(),
  };
}

const SORTABLE = ["title", "publishedAt", "updatedAt", "createdAt", "status"] as const;

export async function listPosts(query: PostListQuery) {
  const where: Prisma.PostWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.authorId ? { authorId: query.authorId } : {}),
    ...(query.categoryId ? { categories: { some: { categoryId: query.categoryId } } } : {}),
    ...(query.tagId ? { tags: { some: { tagId: query.tagId } } } : {}),
    ...(query.q
      ? { OR: [{ title: { contains: query.q } }, { excerpt: { contains: query.q } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: withRelations,
      orderBy: toOrderBy(query, SORTABLE, { updatedAt: "desc" }),
      ...toSkipTake(query),
    }),
    prisma.post.count({ where }),
  ]);

  return paginate(rows.map(toPostDto), total, query.page, query.pageSize);
}

export async function getPostById(id: string): Promise<PostDto> {
  const post = await prisma.post.findUnique({ where: { id }, include: withRelations });
  if (!post) throw new NotFoundError("Post");
  return toPostDto(post);
}

/** Public read — only ever returns published rows. */
export async function getPublishedPostBySlug(slug: string) {
  const post = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: withRelations,
  });
  return post ? toPostDto(post) : null;
}

export async function listPublishedPosts(options: { limit?: number; categoryId?: string } = {}) {
  const rows = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      ...(options.categoryId ? { categories: { some: { categoryId: options.categoryId } } } : {}),
    },
    include: withRelations,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: options.limit,
  });
  return rows.map(toPostDto);
}

export async function createPost(input: PostCreateInput, viewer: Viewer): Promise<PostDto> {
  assertCanSetStatus(viewer, "posts", input.status);

  const slug = await uniqueSlug(input.slug || input.title, slugTaken);

  const post = await prisma.post.create({
    data: {
      ...toWriteData(input),
      title: input.title,
      slug,
      // Whoever creates a post owns it unless an editor reassigns it later.
      authorId: viewer.id,
      publishedAt: publishedAtOnCreate(input.status),
      categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
      tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
    },
    include: withRelations,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "posts.create",
    entity: "Post",
    entityId: post.id,
    summary: post.title,
  });
  revalidateContent(CACHE_TAGS.posts);

  return toPostDto(post);
}

export async function updatePost(
  id: string,
  input: PostUpdateInput,
  viewer: Viewer,
): Promise<PostDto> {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Post");

  assertCanSetStatus(viewer, "posts", input.status, existing.status);

  const slug =
    input.slug && input.slug !== existing.slug
      ? await uniqueSlug(input.slug, (candidate) => slugTaken(candidate, id))
      : undefined;

  // Join rows are replaced wholesale inside one transaction, so a post is
  // never briefly visible with half its categories.
  const post = await prisma.$transaction(async (tx) => {
    if (input.categoryIds) {
      await tx.postCategory.deleteMany({ where: { postId: id } });
      await tx.postCategory.createMany({
        data: input.categoryIds.map((categoryId) => ({ postId: id, categoryId })),
      });
    }
    if (input.tagIds) {
      await tx.postTag.deleteMany({ where: { postId: id } });
      await tx.postTag.createMany({
        data: input.tagIds.map((tagId) => ({ postId: id, tagId })),
      });
    }

    return tx.post.update({
      where: { id },
      data: {
        ...toWriteData(input),
        ...(slug ? { slug } : {}),
        ...publishedAtOnUpdate(input.status, existing),
      },
      include: withRelations,
    });
  });

  await recordAudit({
    actorId: viewer.id,
    action: "posts.update",
    entity: "Post",
    entityId: id,
    summary: post.title,
    diff: diffOf(
      existing as unknown as Record<string, unknown>,
      post as unknown as Record<string, unknown>,
    ),
  });
  revalidateContent(CACHE_TAGS.posts);

  return toPostDto(post);
}

export async function deletePost(id: string, viewer: Viewer) {
  const post = await prisma.post.delete({ where: { id } }).catch(() => null);
  if (!post) throw new NotFoundError("Post");

  await recordAudit({
    actorId: viewer.id,
    action: "posts.delete",
    entity: "Post",
    entityId: id,
    summary: post.title,
  });
  revalidateContent(CACHE_TAGS.posts);
}

function toWriteData(input: PostUpdateInput) {
  const bodyHtml = input.bodyHtml === undefined ? undefined : sanitizeHtml(input.bodyHtml ?? "");

  return {
    title: input.title,
    excerpt: input.excerpt ?? undefined,
    bodyHtml,
    // Derived, never hand-entered — recomputed whenever the body changes.
    readMinutes: bodyHtml === undefined ? undefined : readMinutesOf(bodyHtml),
    coverId: input.coverId ?? undefined,
    status: input.status,
    seoTitle: input.seoTitle ?? undefined,
    seoDescription: input.seoDescription ?? undefined,
    ogImageId: input.ogImageId ?? undefined,
    noIndex: input.noIndex,
  };
}

async function slugTaken(slug: string, exceptId?: string) {
  const found = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(found && found.id !== exceptId);
}
