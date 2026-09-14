import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPublishedServices } from "@/features/public-site/server/site-content";
import { Card, CardContent } from "@/shared/ui/primitives/card";

export const metadata: Metadata = {
  title: "Treatments",
  description:
    "Every dental treatment offered at SmileOn — from routine hygiene to implants, orthodontics and cosmetic dentistry.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getPublishedServices();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Treatments</h1>
      <p className="text-muted-foreground mt-2">
        Everything we offer, from routine check-ups to full smile makeovers.
      </p>

      {services.length === 0 ? (
        <p className="text-muted-foreground mt-8 rounded-lg border border-dashed p-10 text-center text-sm">
          No treatments have been published yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link key={service.id} href={`/services/${service.slug}`} className="group">
              <Card className="h-full overflow-hidden pt-0 transition-shadow group-hover:shadow-md">
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
                  <h2 className="group-hover:text-primary font-medium transition-colors">
                    {service.title}
                  </h2>
                  {service.summary ? (
                    <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">
                      {service.summary}
                    </p>
                  ) : null}
                  {service.duration ? (
                    <p className="text-muted-foreground mt-2 text-xs">{service.duration}</p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
