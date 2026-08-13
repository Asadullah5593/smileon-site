"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/shared/ui/primitives/button";

/**
 * `requirePermission()` throws inside server components; this boundary turns
 * that into a readable "no access" screen instead of a blank error page.
 */
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  // Next 16: `retry()` re-fetches and re-renders the segment. `reset()` only
  // clears the boundary, which for a failed server render just fails again.
  retry: () => void;
}) {
  const forbidden = error.message.toLowerCase().includes("permission");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <ShieldAlert className="text-muted-foreground size-10" aria-hidden />
      <h1 className="text-xl font-semibold">
        {forbidden ? "You don't have access to this page" : "Something went wrong"}
      </h1>
      <p className="text-muted-foreground text-sm">
        {forbidden
          ? "Ask an administrator to grant you the required permission, then reload."
          : error.message}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => retry()}>
          Try again
        </Button>
        <Button asChild>
          <Link href="/admin">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
