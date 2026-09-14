import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { mediaUrl } from "@/shared/storage";
import { CACHE_TAGS } from "@/shared/content/cache-tags";
import { listPublishedServices } from "@/features/services/server/service-repository";
import { getMenuTree } from "@/features/menus/server/menu-repository";
import { listActiveBanners } from "@/features/banners/server/banner-repository";
import { getAllSettings } from "@/features/settings/server/settings-repository";
import {
  getPublishedPostBySlug,
  listPublishedPosts,
} from "@/features/posts/server/post-repository";
import { listTaxonomy } from "@/features/taxonomy/server/taxonomy-repository";

/**
 * Public reads go straight to the database from server components — no HTTP
 * hop — and are wrapped in tagged caches so a CMS save (which calls
 * `revalidateTag`) refreshes the affected pages immediately.
 */

export const getSiteSettings = unstable_cache(
  async () => {
    const rows = await prisma.siteSetting.findMany();
    return Object.fromEntries(rows.map((row) => [row.key, row.value])) as Record<string, unknown>;
  },
  ["site-settings"],
  { tags: [CACHE_TAGS.settings], revalidate: 3600 },
);

export const getPublishedServices = unstable_cache(
  (options?: { featuredOnly?: boolean; limit?: number }) => listPublishedServices(options ?? {}),
  ["published-services"],
  { tags: [CACHE_TAGS.services], revalidate: 3600 },
);

/**
 * A menu as a nested tree.
 *
 * This used to drop every child (`filter(item => !item.parentId)`), which made
 * `MenuItem.parentId` unusable — a nested menu built in the CMS rendered flat.
 */
export const getMenu = unstable_cache((slug: string) => getMenuTree(slug), ["menu"], {
  tags: [CACHE_TAGS.menus],
  revalidate: 3600,
});

export const getActiveBanners = unstable_cache(() => listActiveBanners(), ["banners"], {
  tags: [CACHE_TAGS.banners],
  revalidate: 3600,
});

export const getSettings = unstable_cache(() => getAllSettings(), ["all-settings"], {
  tags: [CACHE_TAGS.settings],
  revalidate: 3600,
});

export const getPublishedPosts = unstable_cache(
  (options?: { limit?: number; categoryId?: string }) => listPublishedPosts(options ?? {}),
  ["published-posts"],
  { tags: [CACHE_TAGS.posts], revalidate: 3600 },
);

export const getPostBySlug = unstable_cache(
  (slug: string) => getPublishedPostBySlug(slug),
  ["post-by-slug"],
  { tags: [CACHE_TAGS.posts], revalidate: 3600 },
);

export const getBlogCategories = unstable_cache(
  () => listTaxonomy({ kind: "category" }),
  ["blog-categories"],
  { tags: [CACHE_TAGS.taxonomy], revalidate: 3600 },
);

/** Published gallery cases — only ones with both images, which is enforced on publish. */
export const getGalleryCases = unstable_cache(
  async () => {
    const rows = await prisma.galleryCase.findMany({
      where: { status: "PUBLISHED" },
      include: {
        beforeMedia: { select: { key: true } },
        afterMedia: { select: { key: true } },
        service: { select: { title: true, slug: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      beforeUrl: mediaUrl(row.beforeMedia?.key),
      afterUrl: mediaUrl(row.afterMedia?.key),
      serviceTitle: row.service?.title ?? null,
      serviceSlug: row.service?.slug ?? null,
    }));
  },
  ["gallery-cases"],
  { tags: [CACHE_TAGS.gallery], revalidate: 3600 },
);

/** Every published team member, with the fields the public profile grid needs. */
export const getFullTeam = unstable_cache(
  async () => {
    const rows = await prisma.teamMember.findMany({
      where: { status: "PUBLISHED" },
      include: { photo: { select: { key: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return rows.map((member) => ({
      id: member.id,
      slug: member.slug,
      name: member.name,
      designation: member.designation,
      bioHtml: member.bioHtml,
      photoUrl: mediaUrl(member.photo?.key),
      qualifications: Array.isArray(member.qualifications)
        ? member.qualifications.filter((q): q is string => typeof q === "string")
        : [],
      specialties: Array.isArray(member.specialties)
        ? member.specialties.filter((s): s is string => typeof s === "string")
        : [],
    }));
  },
  ["full-team"],
  { tags: [CACHE_TAGS.team], revalidate: 3600 },
);

/** FAQs grouped for the dedicated page. */
export const getGroupedFaqs = unstable_cache(
  async () => {
    const rows = await prisma.faqItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    });

    const groups = new Map<string, { id: string; question: string; answerHtml: string }[]>();
    for (const row of rows) {
      const list = groups.get(row.group) ?? [];
      list.push({ id: row.id, question: row.question, answerHtml: row.answerHtml });
      groups.set(row.group, list);
    }

    return [...groups.entries()].map(([group, items]) => ({ group, items }));
  },
  ["grouped-faqs"],
  { tags: [CACHE_TAGS.faqs], revalidate: 3600 },
);

export const getTeam = unstable_cache(
  async (limit?: number) => {
    const rows = await prisma.teamMember.findMany({
      where: { status: "PUBLISHED" },
      include: { photo: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: limit,
    });
    return rows.map((member) => ({
      id: member.id,
      slug: member.slug,
      name: member.name,
      designation: member.designation,
      photoUrl: mediaUrl(member.photo?.key),
    }));
  },
  ["team"],
  { tags: [CACHE_TAGS.team], revalidate: 3600 },
);

export const getTestimonials = unstable_cache(
  async (limit = 6) => {
    const rows = await prisma.testimonial.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
    return rows.map((t) => ({
      id: t.id,
      patientName: t.patientName,
      quote: t.quote,
      rating: t.rating,
    }));
  },
  ["testimonials"],
  { tags: [CACHE_TAGS.testimonials], revalidate: 3600 },
);

export const getFaqs = unstable_cache(
  async (group?: string) => {
    const rows = await prisma.faqItem.findMany({
      where: { status: "PUBLISHED", ...(group ? { group } : {}) },
      orderBy: [{ sortOrder: "asc" }],
    });
    return rows.map((f) => ({ id: f.id, question: f.question, answerHtml: f.answerHtml }));
  },
  ["faqs"],
  { tags: [CACHE_TAGS.faqs], revalidate: 3600 },
);

export const getPrimaryLocation = unstable_cache(
  async () => {
    const location = await prisma.location.findFirst({
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });
    return location;
  },
  ["primary-location"],
  { tags: [CACHE_TAGS.locations], revalidate: 3600 },
);
