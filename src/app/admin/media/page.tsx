import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { MediaLibrary } from "@/features/media/components/MediaLibrary";

export const metadata: Metadata = { title: "Media library" };

export default async function AdminMediaPage() {
  await requirePermission("media.read");

  return (
    <>
      <PageHeader
        title="Media library"
        description="Images are converted to WebP on upload and a thumbnail is generated automatically."
      />
      <MediaLibrary />
    </>
  );
}
