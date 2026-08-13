import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { RedirectsManager } from "@/features/redirects/components/RedirectsManager";

export const metadata: Metadata = { title: "Redirects" };

export default async function AdminRedirectsPage() {
  await requirePermission("redirects.read");

  return (
    <>
      <PageHeader
        title="Redirects"
        description="Send an old address to a new one. Checked whenever a path would otherwise 404."
      />
      <RedirectsManager />
    </>
  );
}
