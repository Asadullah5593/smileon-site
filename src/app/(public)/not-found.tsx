import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/shared/ui/primitives/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function PublicNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-primary text-sm font-medium">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">We couldn&rsquo;t find that page</h1>
      <p className="text-muted-foreground text-sm">
        The link may be out of date, or the page may have moved.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/services">Browse treatments</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Book an appointment</Link>
        </Button>
      </div>
    </div>
  );
}
