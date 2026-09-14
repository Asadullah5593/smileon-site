import type { MetadataRoute } from "next";
import { prisma } from "@/shared/db/prisma";
import { getSetting } from "@/features/settings/server/settings-repository";
import { siteUrl } from "@/shared/config/env";

// Generated per request for the same reason the public layout is dynamic: the
// build must not need a database. Cheap — a handful of indexed slug queries.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

/** Routes that always exist, independent of content. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "weekly" },
  { path: "/team", priority: 0.7, changeFrequency: "monthly" },
  { path: "/gallery", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/faqs", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
];

/** Only published, indexable content ever reaches the sitemap. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSetting("seo");

  // The global kill switch is meant for a site under construction — publishing
  // a sitemap while it is on would invite exactly the crawling it prevents.
  if (seo.noIndexSite) return [];

  const [services, pages, posts] = await Promise.all([
    prisma.service.findMany({
      where: { status: "PUBLISHED", noIndex: false },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { status: "PUBLISHED", noIndex: false },
      select: { slug: true, updatedAt: true },
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED", noIndex: false },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${siteUrl}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...services.map((s) => ({
      url: `${siteUrl}/services/${s.slug}`,
      lastModified: s.updatedAt,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${siteUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.6,
    })),
    ...pages.map((p) => ({
      url: `${siteUrl}/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.5,
    })),
  ];
}
