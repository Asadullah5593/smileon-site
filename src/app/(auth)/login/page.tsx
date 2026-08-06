import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/shared/auth/auth";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in · SmileOn CMS",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  const { next } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/") ? next : "/admin";

  if (session?.user) redirect(target);

  return (
    <main className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-lg font-bold">
              S
            </span>
            <span className="text-xl font-semibold tracking-tight">SmileOn</span>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">Sign in to manage the website.</p>
        </div>

        <LoginForm next={target} />
      </div>
    </main>
  );
}
