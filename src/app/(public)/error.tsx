"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/shared/ui/primitives/button";

/**
 * Public-site error boundary. Server-component errors reach the client with a
 * generic message and a `digest` — the real cause is in the server logs under
 * that same digest, so it is worth showing.
 */
export default function PublicError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[public] render failed", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        Sorry — that page didn&rsquo;t load. Please try again, or call the clinic if you need an
        appointment right away.
      </p>
      {error.digest ? (
        <p className="text-muted-foreground font-mono text-xs">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <Button onClick={() => retry()}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
