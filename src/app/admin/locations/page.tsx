import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { LocationsManager } from "@/features/locations/components/LocationsManager";

export const metadata: Metadata = { title: "Locations" };

export default async function AdminLocationsPage() {
  await requirePermission("locations.read");

  return (
    <>
      <PageHeader
        title="Locations"
        description="Clinic addresses, contact numbers and opening hours. The primary location drives the header, footer and contact page."
      />
      <LocationsManager />
    </>
  );
}
