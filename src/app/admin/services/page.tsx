import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { ServicesTable } from "@/features/services/components/ServicesTable";

export const metadata: Metadata = { title: "Services" };

export default async function AdminServicesPage() {
  // Throws (and renders the nearest error boundary) for anyone without access.
  await requirePermission("services.read");

  return (
    <>
      <PageHeader
        title="Treatments"
        description="Everything the clinic offers, shown under /services on the website."
      />
      <ServicesTable />
    </>
  );
}
