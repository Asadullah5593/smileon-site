import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { UsersManager } from "@/features/access/components/UsersManager";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  await requirePermission("users.read");

  return (
    <>
      <PageHeader
        title="Users"
        description="Staff accounts, their roles, and any per-user permission overrides."
      />
      <UsersManager />
    </>
  );
}
