import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { TeamTable } from "@/features/team/components/TeamTable";

export const metadata: Metadata = { title: "Team" };

export default async function AdminTeamPage() {
  await requirePermission("team.read");

  return (
    <>
      <PageHeader
        title="Team"
        description="The clinicians shown on the website. Order controls how they appear."
      />
      <TeamTable />
    </>
  );
}
