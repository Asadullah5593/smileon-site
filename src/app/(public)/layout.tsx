import Link from "next/link";
import type { Metadata } from "next";
import {
  getMenu,
  getPrimaryLocation,
  getSettings,
} from "@/features/public-site/server/site-content";
import { SiteHeader } from "@/features/public-site/components/SiteHeader";
import { parseOpeningHours, WEEKDAYS } from "@/features/locations/schemas";

/**
 * Render the public site at request time rather than prerendering it at build.
 *
 * Every page here reads the CMS database. Prerendering would make `next build`
 * — and therefore `docker build` — require a reachable production database,
 * which couples the image to an environment and means rebuilding it per
 * deploy target. Set on the layout so it covers every public route, including
 * ones added later.
 *
 * This costs little: the reads underneath are wrapped in `unstable_cache` with
 * a 1-hour lifetime and per-resource tags, so a request renders from cache
 * without touching MySQL, and a CMS save invalidates it immediately. What it
 * gives up is CDN-cacheable static HTML; recovering that would mean either a
 * build-time database or adopting Cache Components, both bigger decisions than
 * this phase.
 */
export const dynamic = "force-dynamic";

/**
 * Applies the global `noIndexSite` switch to every public page.
 *
 * robots.txt alone is not enough: it stops crawling, but anything already
 * indexed stays indexed. The meta tag is what actually removes a page. Set
 * here rather than in the root layout so the build never needs a database for
 * the static `/robots.txt` and `/_not-found` routes.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  if (!settings.seo.noIndexSite) return {};
  return { robots: { index: false, follow: false } };
}

// Labelled text rather than icons: lucide v1 dropped brand glyphs, and a
// wrong-looking approximation of someone's logo is worse than the word.
const SOCIALS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
] as const;

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [headerMenu, footerMenu, location, settings] = await Promise.all([
    getMenu("header"),
    getMenu("footer"),
    getPrimaryLocation(),
    getSettings(),
  ]);

  const hours = parseOpeningHours(location?.openingHours);
  const phone = settings.contact.phone || location?.phone || null;

  return (
    <>
      <SiteHeader items={headerMenu} phone={phone} brandName={settings.brand.name} />

      <main className="flex-1">{children}</main>

      <footer className="bg-secondary/40 mt-16 border-t">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">{settings.brand.name}</p>
            {settings.brand.tagline ? (
              <p className="text-muted-foreground mt-2 text-sm">{settings.brand.tagline}</p>
            ) : null}

            <ul className="text-muted-foreground mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {SOCIALS.map(({ key, label }) =>
                settings.social[key] ? (
                  <li key={key}>
                    <a
                      href={settings.social[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {label}
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          </div>

          {location ? (
            <div className="text-sm">
              <p className="mb-2 font-medium">Visit us</p>
              <p className="text-muted-foreground">{location.address}</p>
              {phone ? (
                <p className="mt-2">
                  <a className="hover:text-primary" href={`tel:${phone}`}>
                    {phone}
                  </a>
                </p>
              ) : null}
              {settings.contact.email ? (
                <p className="mt-1">
                  <a className="hover:text-primary" href={`mailto:${settings.contact.email}`}>
                    {settings.contact.email}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}

          {hours ? (
            <div className="text-sm">
              <p className="mb-2 font-medium">Opening hours</p>
              <dl className="text-muted-foreground space-y-0.5">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="flex justify-between gap-4">
                    <dt className="capitalize">{day.slice(0, 3)}</dt>
                    <dd>
                      {hours[day].closed
                        ? "Closed"
                        : `${hours[day].open ?? "—"}–${hours[day].close ?? "—"}`}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="text-sm">
            <p className="mb-2 font-medium">Quick links</p>
            <ul className="text-muted-foreground space-y-1">
              {footerMenu.length > 0 ? (
                footerMenu.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="hover:text-primary"
                      {...(item.target === "_blank"
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/services" className="hover:text-primary">
                      Treatments
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-primary">
                      Book an appointment
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-primary">
                      Staff login
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="text-muted-foreground border-t px-4 py-4 text-center text-xs">
          © {new Date().getFullYear()} {settings.brand.name}. All rights reserved.
        </div>
      </footer>
    </>
  );
}
