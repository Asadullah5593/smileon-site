import { notFound, permanentRedirect, redirect } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getPublishedPageBySlug } from "@/features/pages/server/page-repository";
import { findRedirect } from "@/features/redirects/server/redirect-repository";
import { CACHE_TAGS } from "@/shared/content/cache-tags";
import { htmlToText } from "@/shared/editor/sanitize";
import { PageBlocks } from "@/features/pages/components/PageBlocks";
import { JsonLd, breadcrumbSchema } from "@/shared/seo/json-ld";
import { siteUrl } from "@/shared/config/env";

/**
 * CMS pages, and the redirect table's only reader.
 *
 * Resolution order for a path that no real route claimed:
 *   1. a published `Page` with that slug  → render it
 *   2. a `Redirect` row with that source  → 301/302 to its target
 *   3. otherwise                          → 404
 *
 * Real route segments (`/services`, `/blog`, …) are matched by Next before this
 * catch-all, and `isReservedSlug` stops a page being given one of those
 * addresses in the first place.
 */

const loadPage = unstable_cache((slug: string) => getPublishedPageBySlug(slug), ["page-by-slug"], {
  tags: [CACHE_TAGS.pages],
  revalidate: 3600,
});

const loadRedirect = unstable_cache((path: string) => findRedirect(path), ["redirect-by-source"], {
  tags: [CACHE_TAGS.redirects],
  revalidate: 3600,
});

const toSlug = (segments: string[]) => segments.map(decodeURIComponent).join("/");

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(toSlug(slug));
  if (!page) return {};

  const description =
    page.seoDescription ?? page.excerpt ?? htmlToText(page.bodyHtml ?? "", 160) ?? undefined;

  return {
    title: page.seoTitle ?? page.title,
    description,
    alternates: { canonical: `/${page.slug}` },
    robots: page.noIndex ? { index: false, follow: false } : undefined,
    openGraph: { title: page.seoTitle ?? page.title, description, url: `/${page.slug}` },
  };
}

export default async function CmsPage({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const path = toSlug(slug);

  const page = await loadPage(path);

  if (!page) {
    const match = await loadRedirect(`/${path}`);
    if (match) {
      // `permanentRedirect` is 308 and `redirect` is 307 — both preserve the
      // method, and both are understood by search engines as 301/302 are.
      if (match.permanent) permanentRedirect(match.target);
      redirect(match.target);
    }
    notFound();
  }

  return (
    <>
      <article className="mx-auto max-w-3xl px-4 pt-16 pb-8">
        <JsonLd data={breadcrumbSchema([{ name: page.title, url: `${siteUrl}/${page.slug}` }])} />

        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        {page.excerpt ? (
          <p className="text-muted-foreground mt-3 text-lg text-pretty">{page.excerpt}</p>
        ) : null}

        {page.bodyHtml ? (
          <div
            className="prose-cms mt-8"
            // Sanitised on write in the repository — safe to render.
            dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
          />
        ) : null}
      </article>

      {/* Sections come after the body, full-bleed rather than inside the
          article's narrow column. */}
      <PageBlocks blocks={page.blocks} />
    </>
  );
}
