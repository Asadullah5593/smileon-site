import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { RolesManager } from "@/features/access/components/RolesManager";

export const metadata: Metadata = { title: "Roles & permissions" };

export default async function AdminRolesPage() {
  await requirePermission("roles.read");

  return (
    <>
      <PageHeader
        title="Roles & permissions"
        description="Roles bundle permissions; users get one or more roles. Permissions themselves are defined in code and synced into the database."
      />
      <RolesManager />
    </>
  );
}
