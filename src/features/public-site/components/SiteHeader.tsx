"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import type { MenuItemDto } from "@/features/menus/schemas";
import { Button } from "@/shared/ui/primitives/button";

/** Used until someone builds a header menu in the CMS. */
const FALLBACK: MenuItemDto[] = [
  { label: "Treatments", href: "/services" },
  { label: "Our team", href: "/team" },
  { label: "Before & after", href: "/gallery" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
].map((item, index) => ({
  id: `fallback-${index}`,
  menuId: "fallback",
  parentId: null,
  target: "_self",
  sortOrder: index,
  children: [],
  ...item,
}));

function linkProps(item: MenuItemDto) {
  return item.target === "_blank" ? { target: "_blank", rel: "noopener noreferrer" as const } : {};
}

export function SiteHeader({
  items,
  phone,
  brandName,
}: {
  items: MenuItemDto[];
  phone: string | null;
  brandName: string;
}) {
  const [open, setOpen] = useState(false);
  const links = items.length > 0 ? items : FALLBACK;

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-lg font-bold">
            S
          </span>
          <span className="text-lg font-semibold tracking-tight">{brandName}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((item) =>
            item.children.length > 0 ? (
              // CSS-driven dropdown: hover *and* focus-within, so it opens for
              // keyboard users too without any JS state.
              <div key={item.id} className="group relative">
                <Link
                  href={item.href}
                  {...linkProps(item)}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors"
                >
                  {item.label}
                  <ChevronDown className="size-3.5" aria-hidden />
                </Link>
                <ul className="bg-popover invisible absolute top-full left-0 z-50 min-w-52 rounded-lg border p-1 opacity-0 shadow-md transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        {...linkProps(child)}
                        className="hover:bg-accent block rounded-md px-3 py-2 text-sm"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Link
                key={item.id}
                href={item.href}
                {...linkProps(item)}
                className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm transition-colors"
              >
                {item.label}
              </Link>
            ),
          )}
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
                  {...linkProps(item)}
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent block rounded-md px-2 py-2 text-sm"
                >
                  {item.label}
                </Link>
                {item.children.length > 0 ? (
                  <ul className="border-muted ml-3 border-l pl-3">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={child.href}
                          {...linkProps(child)}
                          onClick={() => setOpen(false)}
                          className="text-muted-foreground hover:bg-accent block rounded-md px-2 py-2 text-sm"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
