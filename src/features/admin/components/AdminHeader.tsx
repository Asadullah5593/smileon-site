"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { Button } from "@/shared/ui/primitives/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/primitives/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/primitives/dropdown-menu";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { usePermissions } from "@/shared/auth/permissions-context";

export function AdminHeader() {
  const { viewer } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-background/95 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" target="_blank">
            View site <ExternalLink className="ml-1 size-3.5" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-full text-xs font-semibold">
                {viewer.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{viewer.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="font-medium">{viewer.name}</p>
              <p className="text-muted-foreground text-xs">{viewer.email}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {viewer.isSuperAdmin
                  ? "Super admin"
                  : viewer.roles.map((r) => r.name).join(", ") || "No roles assigned"}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
