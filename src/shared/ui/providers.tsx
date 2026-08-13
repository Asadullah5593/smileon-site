"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/shared/ui/primitives/sonner";
import { ApiError } from "@/shared/api/http";

/**
 * App-wide client providers: session, data cache, URL state, toasts.
 *
 * There is deliberately no `ThemeProvider`. It was configured
 * `defaultTheme="light" enableSystem={false}` and nothing in the app calls
 * `setTheme`, so the theme could never be anything but light — while the
 * before-paint `<script>` next-themes injects to apply a *varying* theme still
 * rendered, which React 19 warns about because client-rendered scripts never
 * execute.
 *
 * The `.dark` block in `globals.css` and the `dark:` utilities are untouched.
 * Bringing dark mode back means re-adding the provider *and* a control that
 * calls `setTheme` — without one, the provider is inert.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Retrying a 403 or a 422 only delays the error the user needs to see.
            retry: (failureCount, error) =>
              error instanceof ApiError && error.status < 500 ? false : failureCount < 2,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </NuqsAdapter>
      </QueryClientProvider>
    </SessionProvider>
  );
}
