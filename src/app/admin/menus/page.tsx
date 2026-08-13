import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { MenusManager } from "@/features/menus/components/MenusManager";

export const metadata: Metadata = { title: "Navigation" };

export default async function AdminMenusPage() {
  await requirePermission("menus.read");

  return (
    <>
      <PageHeader
        title="Navigation"
        description="The header and footer menus. Nest an item under another to make a dropdown."
      />
      <MenusManager />
    </>
  );
}
