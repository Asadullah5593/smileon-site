import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getGalleryCases } from "@/features/public-site/server/site-content";
import { Card, CardContent } from "@/shared/ui/primitives/card";

export const metadata: Metadata = {
  title: "Before & after",
  description: "Real treatment results from patients at SmileOn.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const cases = await getGalleryCases();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Before &amp; after</h1>
      <p className="text-muted-foreground mt-2">
        Real results from real patients, shared with their permission.
      </p>

      {cases.length === 0 ? (
        <p className="text-muted-foreground mt-8 rounded-lg border border-dashed p-8 text-center text-sm">
          No cases published yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
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
                <h2 className="font-medium">{item.title}</h2>
                {item.description ? (
                  <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                ) : null}
                {item.serviceSlug ? (
                  <Link
                    href={`/services/${item.serviceSlug}`}
                    className="text-primary mt-2 inline-block text-sm underline underline-offset-4"
                  >
                    About {item.serviceTitle}
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
