"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { ADMIN_NAV } from "@/features/admin/navigation";
import { usePermissions } from "@/shared/auth/permissions-context";
import { cn } from "@/shared/utils/cn";

function Icon({ name, className }: { name: string; className?: string }) {
  const Component = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <Component className={className} aria-hidden />;
}

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { canAny } = usePermissions();

  // Sections whose items are all hidden disappear along with their heading.
  const sections = ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.anyOf.length === 0 || canAny(...item.anyOf)),
  })).filter((section) => section.items.length > 0);

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-4" aria-label="Admin">
      <Link href="/admin" className="flex items-center gap-2 px-2" onClick={onNavigate}>
        <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg font-bold">
          S
        </span>
        <span className="text-lg font-semibold tracking-tight">SmileOn CMS</span>
      </Link>

      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-muted-foreground px-2 pb-1 text-xs font-medium tracking-wide uppercase">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon name={item.icon} className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
