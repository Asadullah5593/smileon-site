import Link from "next/link";
import type { Metadata } from "next";
import { peekInvitation } from "@/features/auth/server/invitation-repository";
import { SetPasswordForm } from "@/features/auth/components/SetPasswordForm";

export const metadata: Metadata = {
  title: "Accept your invitation · SmileOn CMS",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const invitation = await peekInvitation(token);

  return (
    <main className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {invitation ? (
          <>
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight">
                Welcome{invitation.name ? `, ${invitation.name}` : ""}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Choose a password for <strong>{invitation.email}</strong>.
              </p>
            </div>
            <SetPasswordForm mode="invite" token={token} />
          </>
        ) : (
          <div className="bg-card space-y-2 rounded-xl border p-6 text-sm shadow-sm">
            <p className="font-medium">This invitation is no longer valid</p>
            <p className="text-muted-foreground">
              It may have expired or already been used. Ask whoever invited you for a new link.
            </p>
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
