import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { TaxonomyManager } from "@/features/taxonomy/components/TaxonomyManager";

export const metadata: Metadata = { title: "Categories & tags" };

export default async function AdminTaxonomyPage() {
  await requirePermission("taxonomy.read");

  return (
    <>
      <PageHeader
        title="Categories & tags"
        description="How blog posts and treatments are grouped. A term in use cannot be deleted."
      />
      <TaxonomyManager />
    </>
  );
}
