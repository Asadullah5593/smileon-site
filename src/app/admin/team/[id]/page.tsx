import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { getTeamMemberById } from "@/features/team/server/team-repository";
import { NotFoundError } from "@/shared/api/errors";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { TeamForm } from "@/features/team/components/TeamForm";

export const metadata: Metadata = { title: "Edit team member" };

export default async function EditTeamMemberPage({ params }: PageProps<"/admin/team/[id]">) {
  await requirePermission("team.update");
  const { id } = await params;

  const member = await getTeamMemberById(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        title={member.name}
        description={`Last updated ${new Date(member.updatedAt).toLocaleString()}`}
      />
      <TeamForm member={member} />
    </>
  );
}
