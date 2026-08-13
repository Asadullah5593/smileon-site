import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { listServiceOptions } from "@/features/services/server/service-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { TestimonialsManager } from "@/features/testimonials/components/TestimonialsManager";

export const metadata: Metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  await requirePermission("testimonials.read");
  const services = await listServiceOptions();

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="What patients say. Publishing one is the moderation step — drafts stay off the website."
      />
      <TestimonialsManager services={services} />
    </>
  );
}
