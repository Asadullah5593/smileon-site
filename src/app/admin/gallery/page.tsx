import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { listServiceOptions } from "@/features/services/server/service-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { GalleryManager } from "@/features/gallery/components/GalleryManager";

export const metadata: Metadata = { title: "Before & after" };
export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  await requirePermission("gallery.read");
  const services = await listServiceOptions();

  return (
    <>
      <PageHeader
        title="Before & after"
        description="Paired treatment photos. A case needs both images before it can be published."
      />
      <GalleryManager services={services} />
    </>
  );
}
