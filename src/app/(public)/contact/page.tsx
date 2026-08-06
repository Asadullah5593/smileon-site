import type { Metadata } from "next";
import { MapPin, Phone } from "lucide-react";
import {
  getPrimaryLocation,
  getPublishedServices,
} from "@/features/public-site/server/site-content";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";

export const metadata: Metadata = {
  title: "Book an appointment",
  description: "Request a dental appointment at SmileOn — we'll call you back to confirm.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [services, location] = await Promise.all([getPublishedServices(), getPrimaryLocation()]);

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Book an appointment</h1>
        <p className="text-muted-foreground mt-2">
          Tell us when suits you and we&rsquo;ll call to confirm.
        </p>
        <div className="mt-8">
          <AppointmentForm
            services={services.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))}
          />
        </div>
      </div>

      {location ? (
        <aside className="bg-secondary/30 h-fit rounded-xl border p-6 text-sm">
          <h2 className="font-medium">{location.name}</h2>
          <p className="text-muted-foreground mt-3 flex gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            {location.address}
          </p>
          {location.phone ? (
            <p className="mt-3 flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={`tel:${location.phone}`} className="hover:text-primary">
                {location.phone}
              </a>
            </p>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
