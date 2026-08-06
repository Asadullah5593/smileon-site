"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/shared/ui/primitives/button";

type Item = { id: string; label: string; href: string };

const FALLBACK: Item[] = [
  { id: "services", label: "Treatments", href: "/services" },
  { id: "team", label: "Our team", href: "/team" },
  { id: "gallery", label: "Before & after", href: "/gallery" },
  { id: "contact", label: "Contact", href: "/contact" },
];

export function SiteHeader({ items, phone }: { items: Item[]; phone: string | null }) {
  const [open, setOpen] = useState(false);
  // Until someone builds a header menu in the CMS, fall back to sensible links.
  const links = items.length > 0 ? items : FALLBACK;

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-lg font-bold">
            S
          </span>
          <span className="text-lg font-semibold tracking-tight">SmileOn</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Main">
          {links.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {phone ? (
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <a href={`tel:${phone}`}>
                <Phone className="size-4" /> {phone}
              </a>
            </Button>
          ) : null}
          <Button size="sm" asChild>
            <Link href="/contact">Book appointment</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav className="border-t px-4 py-3 md:hidden" aria-label="Mobile">
          <ul className="space-y-1">
            {links.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent block rounded-md px-2 py-2 text-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
