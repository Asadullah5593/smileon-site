import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Quote, Star, User } from "lucide-react";
import type { PageBlock } from "@/features/pages/blocks";
import {
  getActiveBanners,
  getFullTeam,
  getGalleryCases,
  getGroupedFaqs,
  getPublishedServices,
  getTestimonials,
} from "@/features/public-site/server/site-content";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { Button } from "@/shared/ui/primitives/button";
import { Card, CardContent } from "@/shared/ui/primitives/card";
import { Skeleton } from "@/shared/ui/primitives/skeleton";

/**
 * Renders the sections a page was assembled from.
 *
 * Each block reads through the same cached `site-content` helpers the rest of
 * the public site uses, so a CMS save invalidates a page containing a block
 * exactly as it invalidates the homepage.
 */
export async function PageBlocks({ blocks }: { blocks?: PageBlock[] | null }) {
  // Tolerates a missing value rather than requiring one. The repository always
  // returns an array, but this renders through `unstable_cache` — an entry
  // written before `blocks` existed on the DTO comes back without the field,
  // and a stale cache should not crash the page.
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => (
        <BlockSection key={block.id} block={block} />
      ))}
    </>
  );
}

function SectionHeading({ heading }: { heading?: string | null }) {
  if (!heading) return null;
  return <h2 className="mb-6 text-2xl font-semibold tracking-tight">{heading}</h2>;
}

async function BlockSection({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "richText":
      return block.html ? (
        <section className="prose-cms mx-auto max-w-3xl px-4 py-8">
          {/* Sanitised on write in the page repository — safe to render. */}
          <div dangerouslySetInnerHTML={{ __html: block.html }} />
        </section>
      ) : null;

    case "banner": {
      const banners = await getActiveBanners();
      const banner = block.bannerId
        ? (banners.find((b) => b.id === block.bannerId) ?? null)
        : (banners[0] ?? null);
      if (!banner) return null;

      return (
        <section className="from-accent/50 bg-gradient-to-b to-transparent">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                {banner.heading}
              </h2>
              {banner.subheading ? (
                <p className="text-muted-foreground mt-3 text-lg text-pretty">
                  {banner.subheading}
                </p>
              ) : null}
              {banner.ctaLabel && banner.ctaHref ? (
                <Button size="lg" className="mt-6" asChild>
                  <Link href={banner.ctaHref}>{banner.ctaLabel}</Link>
                </Button>
              ) : null}
            </div>
            {banner.mediaUrl ? (
              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-2xl border">
                <Image
                  src={banner.mediaUrl}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
        </section>
      );
    }

    case "team": {
      const team = (await getFullTeam()).slice(0, block.limit);
      if (team.length === 0) return null;

      return (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeading heading={block.heading} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <Card key={member.id} className="overflow-hidden pt-0 text-center">
                <div className="bg-muted relative aspect-square">
                  {member.photoUrl ? (
                    <Image
                      src={member.photoUrl}
                      alt={member.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <User
                      className="text-muted-foreground absolute inset-0 m-auto size-8"
                      aria-hidden
                    />
                  )}
                </div>
                <CardContent>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-muted-foreground text-sm">{member.designation}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );
    }

    case "testimonials": {
      const testimonials = await getTestimonials(block.limit);
      if (testimonials.length === 0) return null;

      return (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeading heading={block.heading} />
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="pt-6">
                  <Quote className="text-primary/40 size-6" aria-hidden />
                  <p className="mt-2 text-sm">{testimonial.quote}</p>
                  <div className="mt-3 flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="fill-warning text-warning size-3.5" aria-hidden />
                    ))}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm font-medium">
                    {testimonial.patientName}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );
    }

    case "faqs": {
      const groups = await getGroupedFaqs();
      const items = groups
        .filter((group) => !block.group || group.group === block.group)
        .flatMap((group) => group.items);
      if (items.length === 0) return null;

      return (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <SectionHeading heading={block.heading} />
          <dl className="divide-y rounded-lg border">
            {items.map((faq) => (
              <div key={faq.id} className="p-4">
                <dt className="font-medium">{faq.question}</dt>
                <dd
                  className="prose-cms text-muted-foreground mt-1 text-sm"
                  // Sanitised on write in the FAQ repository — safe to render.
                  dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                />
              </div>
            ))}
          </dl>
        </section>
      );
    }

    case "gallery": {
      const cases = (await getGalleryCases()).slice(0, block.limit);
      if (cases.length === 0) return null;

      return (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeading heading={block.heading} />
          <div className="grid gap-6 sm:grid-cols-2">
            {cases.map((item) => (
              <Card key={item.id} className="overflow-hidden pt-0">
                <div className="grid grid-cols-2">
                  {(
                    [
                      { label: "Before", url: item.beforeUrl },
                      { label: "After", url: item.afterUrl },
                    ] as const
                  ).map((side) => (
                    <figure key={side.label} className="bg-muted relative aspect-square">
                      {side.url ? (
                        <Image
                          src={side.url}
                          alt={`${item.title} — ${side.label.toLowerCase()}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />
                      ) : null}
                      <figcaption className="bg-background/80 absolute bottom-0 left-0 px-2 py-1 text-xs font-medium backdrop-blur">
                        {side.label}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <CardContent>
                  <p className="font-medium">{item.title}</p>
                  {item.description ? (
                    <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );
    }

    case "appointmentForm": {
      const services = await getPublishedServices();

      return (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <SectionHeading heading={block.heading} />
          {/* The form reads ?service= via useSearchParams, so it needs its own
              boundary or it would opt the whole page out of the static shell. */}
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <AppointmentForm
              services={services.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))}
            />
          </Suspense>
        </section>
      );
    }
  }
}
