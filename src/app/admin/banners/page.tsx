import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { BannersManager } from "@/features/banners/components/BannersManager";

export const metadata: Metadata = { title: "Banners" };

export default async function AdminBannersPage() {
  await requirePermission("banners.read");

  return (
    <>
      <PageHeader
        title="Home banners"
        description="The rotating hero at the top of the homepage. Only active banners are shown."
      />
      <BannersManager />
    </>
  );
}
