import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { TeamForm } from "@/features/team/components/TeamForm";

export const metadata: Metadata = { title: "New team member" };

export default async function NewTeamMemberPage() {
  await requirePermission("team.create");

  return (
    <>
      <PageHeader title="New team member" description="They stay a draft until you publish them." />
      <TeamForm />
    </>
  );
}
