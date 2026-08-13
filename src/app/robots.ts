import type { MetadataRoute } from "next";
import { getSetting } from "@/features/settings/server/settings-repository";
import { siteUrl } from "@/shared/config/env";

// Reads the settings table, so it must not run at build time.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSetting("seo");

  // The global kill switch, for a site that isn't ready to be found yet.
  if (seo.noIndexSite) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/login", "/invite/", "/reset-password/", "/forgot-password"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
