import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Skeleton } from "@/shared/ui/primitives/skeleton";
import {
  getPrimaryLocation,
  getPublishedServices,
  getSettings,
} from "@/features/public-site/server/site-content";
import { parseOpeningHours, WEEKDAYS } from "@/features/locations/schemas";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { JsonLd, dentistSchema, openingHoursSchema } from "@/shared/seo/json-ld";
import { siteUrl } from "@/shared/config/env";

export const metadata: Metadata = {
  title: "Book an appointment",
  description: "Request a dental appointment at SmileOn — we'll call you back to confirm.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [services, location, settings] = await Promise.all([
    getPublishedServices(),
    getPrimaryLocation(),
    getSettings(),
  ]);

  const hours = parseOpeningHours(location?.openingHours);
  const phone = settings.contact.phone || location?.phone || null;
  const whatsapp = settings.contact.whatsapp || location?.whatsapp || null;
  const email = settings.contact.email || location?.email || null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <JsonLd
        data={{
          ...dentistSchema({
            url: siteUrl,
            name: settings.brand.name,
            telephone: phone,
            address: location?.address ?? null,
          }),
          ...(hours ? { openingHoursSpecification: openingHoursSchema(hours) } : {}),
        }}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Book an appointment</h1>
          <p className="text-muted-foreground mt-2">
            Tell us when suits you and we&rsquo;ll call to confirm.
          </p>

          {settings.contact.emergencyPhone ? (
            <p className="bg-destructive/10 mt-6 rounded-lg p-3 text-sm">
              In pain right now? Call{" "}
              <a
                href={`tel:${settings.contact.emergencyPhone}`}
                className="font-medium underline underline-offset-4"
              >
                {settings.contact.emergencyPhone}
              </a>{" "}
              for same-day emergency care.
            </p>
          ) : null}

          <div className="mt-8">
            {/* The form reads ?service= via useSearchParams, so it needs a
                boundary for the rest of the page to stay prerendered. */}
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <AppointmentForm
                services={services.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))}
              />
            </Suspense>
          </div>
        </div>

        {location ? (
          <aside className="h-fit space-y-6">
            <div className="bg-secondary/30 rounded-xl border p-6 text-sm">
              <h2 className="font-medium">{location.name}</h2>

              <p className="text-muted-foreground mt-3 flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                {location.address}
              </p>

              {phone ? (
                <p className="mt-3 flex gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <a href={`tel:${phone}`} className="hover:text-primary">
                    {phone}
                  </a>
                </p>
              ) : null}

              {whatsapp ? (
                <p className="mt-2 flex gap-2">
                  <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    WhatsApp us
                  </a>
                </p>
              ) : null}

              {email ? (
                <p className="mt-2 flex gap-2">
                  <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <a href={`mailto:${email}`} className="hover:text-primary">
                    {email}
                  </a>
                </p>
              ) : null}
            </div>

            {hours ? (
              <div className="rounded-xl border p-6 text-sm">
                <h2 className="mb-3 font-medium">Opening hours</h2>
                <dl className="space-y-1">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="flex justify-between gap-4">
                      <dt className="capitalize">{day}</dt>
                      <dd className="text-muted-foreground">
                        {hours[day].closed
                          ? "Closed"
                          : `${hours[day].open ?? "—"} – ${hours[day].close ?? "—"}`}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {location.mapEmbedUrl ? (
              <div className="overflow-hidden rounded-xl border">
                <iframe
                  src={location.mapEmbedUrl}
                  title={`Map to ${location.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-square w-full"
                />
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
