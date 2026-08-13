import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password · SmileOn CMS",
  robots: { index: false, follow: false },
};

/**
 * Rendered per request so it receives the CSP nonce from `proxy.ts`. A
 * prerendered page has no request to read the nonce from, so its scripts would
 * be blocked by `script-src 'strict-dynamic'` and the form would never hydrate.
 */
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            We&rsquo;ll email you a link to choose a new one.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="hover:text-foreground underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
