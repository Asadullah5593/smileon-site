import Link from "next/link";
import { getMenu, getPrimaryLocation } from "@/features/public-site/server/site-content";
import { SiteHeader } from "@/features/public-site/components/SiteHeader";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [menu, location] = await Promise.all([getMenu("header"), getPrimaryLocation()]);

  return (
    <>
      <SiteHeader
        items={menu.map((item) => ({ id: item.id, label: item.label, href: item.href }))}
        phone={location?.phone ?? null}
      />

      <main className="flex-1">{children}</main>

      <footer className="bg-secondary/40 mt-16 border-t">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-lg font-semibold tracking-tight">SmileOn Dental Clinic</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Specialist dental care — cosmetic dentistry, implants, orthodontics and emergency
              treatment.
            </p>
          </div>

          {location ? (
            <div className="text-sm">
              <p className="mb-2 font-medium">Visit us</p>
              <p className="text-muted-foreground">{location.address}</p>
              {location.phone ? (
                <p className="mt-2">
                  <a className="hover:text-primary" href={`tel:${location.phone}`}>
                    {location.phone}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="text-sm">
            <p className="mb-2 font-medium">Quick links</p>
            <ul className="text-muted-foreground space-y-1">
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
            </ul>
          </div>
        </div>

        <div className="text-muted-foreground border-t px-4 py-4 text-center text-xs">
          © {new Date().getFullYear()} SmileOn Dental Clinic. All rights reserved.
        </div>
      </footer>
    </>
  );
}
