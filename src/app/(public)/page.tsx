import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Quote, ShieldCheck, Sparkles, Star } from "lucide-react";
import {
  getActiveBanners,
  getFaqs,
  getPublishedServices,
  getSettings,
  getTeam,
  getTestimonials,
} from "@/features/public-site/server/site-content";
import { Button } from "@/shared/ui/primitives/button";
import { Card, CardContent } from "@/shared/ui/primitives/card";
import { JsonLd, dentistSchema, faqSchema } from "@/shared/seo/json-ld";
import { siteUrl } from "@/shared/config/env";

export default async function HomePage() {
  const [featured, services, team, testimonials, faqs, banners, settings] = await Promise.all([
    getPublishedServices({ featuredOnly: true, limit: 6 }),
    getPublishedServices({ limit: 6 }),
    getTeam(4),
    getTestimonials(3),
    getFaqs(),
    getActiveBanners(),
    getSettings(),
  ]);

  const cards = featured.length > 0 ? featured : services;
  // The first active banner is the hero; the hardcoded copy is the fallback
  // for a site that hasn't set one up yet.
  const hero = banners[0] ?? null;

  return (
    <>
      <JsonLd data={dentistSchema({ url: siteUrl })} />
      {faqs.length > 0 ? <JsonLd data={faqSchema(faqs)} /> : null}

      <section className="from-accent/50 bg-gradient-to-b to-transparent">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
          <div>
            <p className="text-primary flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4" /> Specialist dental care in Lahore
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {hero?.heading ??
                settings.brand.tagline ??
                "A healthier smile, handled by specialists"}
            </h1>
            <p className="text-muted-foreground mt-4 text-lg text-pretty">
              {hero?.subheading ??
                "Cosmetic dentistry, implants, orthodontics and emergency treatment — delivered by a team that treats every patient like family."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={hero?.ctaHref ?? "/contact"}>
                  {hero?.ctaLabel ?? "Book an appointment"}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/services">
                  Browse treatments <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-6 flex items-center gap-2 text-sm">
              <ShieldCheck className="text-primary size-4" /> Sterilisation and patient-safety
              protocols on every visit
            </p>
          </div>

          {hero?.mediaUrl ? (
            <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-2xl border shadow-sm">
              <Image
                src={hero.mediaUrl}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-card rounded-2xl border p-6 shadow-sm">
              <p className="text-muted-foreground text-sm">
                This site is running on the SmileOn CMS.
              </p>
              <p className="mt-2 text-sm">
                Add a banner under{" "}
                <Link href="/admin/banners" className="text-primary underline underline-offset-4">
                  Banners
                </Link>{" "}
                to replace this panel with your own hero image.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Treatments</h2>
        <p className="text-muted-foreground mt-1">What we can help you with.</p>

        {cards.length === 0 ? (
          <p className="text-muted-foreground mt-6 rounded-lg border border-dashed p-8 text-center text-sm">
            No treatments published yet — add one in the CMS and it appears here.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((service) => (
              <Card key={service.id} className="overflow-hidden pt-0">
                {service.imageUrl ? (
                  <div className="bg-muted relative aspect-[16/9]">
                    <Image
                      src={service.imageUrl}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <CardContent className={service.imageUrl ? "" : "pt-6"}>
                  <h3 className="font-medium">{service.title}</h3>
                  {service.summary ? (
                    <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">
                      {service.summary}
                    </p>
                  ) : null}
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-primary mt-3 inline-flex items-center gap-1 text-sm underline underline-offset-4"
                  >
                    Learn more <ArrowRight className="size-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {team.length > 0 ? (
        <section className="bg-secondary/30 border-y py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-2xl font-semibold tracking-tight">Meet the team</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    ) : null}
                  </div>
                  <CardContent>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-muted-foreground text-sm">{member.designation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {testimonials.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">What patients say</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
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
      ) : null}

      {faqs.length > 0 ? (
        <section className="mx-auto max-w-3xl px-4 pb-20">
          <h2 className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
          <dl className="mt-6 divide-y rounded-lg border">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-4">
                <dt className="font-medium">{faq.question}</dt>
                <dd
                  className="prose-cms text-muted-foreground mt-1 text-sm"
                  dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                />
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </>
  );
}
