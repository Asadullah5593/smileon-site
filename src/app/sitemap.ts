import type { MetadataRoute } from "next";
import { prisma } from "@/shared/db/prisma";
import { siteUrl } from "@/shared/config/env";

export const revalidate = 3600;

/** Only published, indexable content ever reaches the sitemap. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.8 },
  ];

  return [
    ...staticRoutes,
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
