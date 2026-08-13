import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { getAuditFacets } from "@/features/audit/server/audit-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { AuditLogTable } from "@/features/audit/components/AuditLogTable";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requirePermission("audit.read");
  const facets = await getAuditFacets();

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Who changed what, and when. Append-only — entries cannot be edited or removed."
      />
      <AuditLogTable facets={facets} />
    </>
  );
}
