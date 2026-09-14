import "server-only";
import { revalidateTag } from "next/cache";

/**
 * Every tag the public site caches under, in one place.
 *
 * Public reads wrap their queries in `unstable_cache(..., { tags: [...] })`;
 * repositories call `revalidateContent()` after a write. Keeping the names here
 * rather than as string literals on both sides is what stops a save from
 * silently failing to refresh the page that shows it.
 */
export const CACHE_TAGS = {
  services: "services",
  pages: "pages",
  posts: "posts",
  taxonomy: "taxonomy",
  team: "team",
  testimonials: "testimonials",
  faqs: "faqs",
  gallery: "gallery",
  locations: "locations",
  menus: "menus",
  banners: "banners",
  settings: "site-settings",
  redirects: "redirects",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/**
 * Drop the cached public pages for these tags so a CMS edit is live at once.
 * `"max"` invalidates every cache profile, which is what an editor expects
 * after pressing Save.
 */
export function revalidateContent(...tags: CacheTag[]): void {
  for (const tag of tags) revalidateTag(tag, "max");
}
