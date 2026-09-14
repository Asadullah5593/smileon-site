import Link from "next/link";
import type { Metadata } from "next";
import { isResetTokenValid } from "@/features/auth/server/password-reset-repository";
import { SetPasswordForm } from "@/features/auth/components/SetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password · SmileOn CMS",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  const { token } = await params;
  const valid = await isResetTokenValid(token);

  return (
    <main className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">Choose a new password</h1>
        </div>

        {valid ? (
          <SetPasswordForm mode="reset" token={token} />
        ) : (
          <div className="bg-card space-y-2 rounded-xl border p-6 text-sm shadow-sm">
            <p className="font-medium">This link no longer works</p>
            <p className="text-muted-foreground">
              Reset links expire after an hour and can only be used once.
            </p>
            <Link
              href="/forgot-password"
              className="text-primary inline-block underline underline-offset-4"
            >
              Request a new one
            </Link>
          </div>
        )}

        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="hover:text-foreground underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
