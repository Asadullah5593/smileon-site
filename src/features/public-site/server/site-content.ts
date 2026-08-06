import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { mediaUrl } from "@/shared/storage";
import { listPublishedServices } from "@/features/services/server/service-repository";

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
  { tags: ["site-settings"], revalidate: 3600 },
);

export const getPublishedServices = unstable_cache(
  (options?: { featuredOnly?: boolean; limit?: number }) => listPublishedServices(options ?? {}),
  ["published-services"],
  { tags: ["services"], revalidate: 3600 },
);

export const getMenu = unstable_cache(
  async (slug: string) => {
    const menu = await prisma.menu.findUnique({
      where: { slug },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    return menu?.items.filter((item) => !item.parentId) ?? [];
  },
  ["menu"],
  { tags: ["menus"], revalidate: 3600 },
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
  { tags: ["team"], revalidate: 3600 },
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
  { tags: ["testimonials"], revalidate: 3600 },
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
  { tags: ["faqs"], revalidate: 3600 },
);

export const getPrimaryLocation = unstable_cache(
  async () => {
    const location = await prisma.location.findFirst({
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });
    return location;
  },
  ["primary-location"],
  { tags: ["locations"], revalidate: 3600 },
);
