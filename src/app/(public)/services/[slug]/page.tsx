import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getPublishedServiceBySlug } from "@/features/services/server/service-repository";
import { htmlToText } from "@/shared/editor/sanitize";
import { siteUrl } from "@/shared/config/env";
import { Button } from "@/shared/ui/primitives/button";
import { JsonLd, breadcrumbSchema, serviceSchema } from "@/shared/seo/json-ld";

const loadService = unstable_cache(
  (slug: string) => getPublishedServiceBySlug(slug),
  ["service-by-slug"],
  { tags: ["services"], revalidate: 3600 },
);

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await loadService(slug);
  if (!service) return {};

  const description =
    service.seoDescription ?? service.summary ?? htmlToText(service.bodyHtml ?? "", 160);

  return {
    title: service.seoTitle ?? service.title,
    description,
    alternates: { canonical: `/services/${service.slug}` },
    robots: service.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: service.seoTitle ?? service.title,
      description,
      url: `/services/${service.slug}`,
      ...(service.imageUrl ? { images: [service.imageUrl] } : {}),
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = await loadService(slug);
  if (!service) notFound();

  const url = `${siteUrl}/services/${service.slug}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd
        data={serviceSchema({
          name: service.title,
          description: service.summary,
          url,
          image: service.imageUrl,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Treatments", url: `${siteUrl}/services` },
          { name: service.title, url },
        ])}
      />

      <nav className="text-muted-foreground mb-4 text-sm">
        <Link href="/services" className="hover:text-foreground">
          Treatments
        </Link>{" "}
        / <span>{service.title}</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight">{service.title}</h1>
      {service.summary ? (
        <p className="text-muted-foreground mt-3 text-lg text-pretty">{service.summary}</p>
      ) : null}

      <dl className="text-muted-foreground mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {service.duration ? (
          <div>
            <dt className="inline font-medium">Duration: </dt>
            <dd className="inline">{service.duration}</dd>
          </div>
        ) : null}
        {service.priceFrom ? (
          <div>
            <dt className="inline font-medium">From: </dt>
            <dd className="inline">PKR {service.priceFrom.toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>

      {service.imageUrl ? (
        <div className="bg-muted relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src={service.imageUrl}
            alt={service.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            className="object-cover"
          />
        </div>
      ) : null}

      {service.bodyHtml ? (
        <div
          className="prose-cms mt-8"
          // Sanitized on write in the repository — safe to render.
          dangerouslySetInnerHTML={{ __html: service.bodyHtml }}
        />
      ) : null}

      <div className="bg-secondary/40 mt-10 rounded-xl border p-6 text-center">
        <p className="font-medium">Ready to book {service.title.toLowerCase()}?</p>
        <Button className="mt-3" asChild>
          <Link href={`/contact?service=${service.slug}`}>Request an appointment</Link>
        </Button>
      </div>
    </article>
  );
}
