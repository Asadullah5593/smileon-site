import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { PagesTable } from "@/features/pages/components/PagesTable";

export const metadata: Metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  await requirePermission("pages.read");

  return (
    <>
      <PageHeader
        title="Pages"
        description="Standalone pages such as About or Patient safety. They live at the address you give them."
      />
      <PagesTable />
    </>
  );
}
