import type { Metadata } from "next";
import { requireUser } from "@/shared/auth/permissions";
import { getProfile } from "@/features/profile/server/profile-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { ProfileManager } from "@/features/profile/components/ProfileManager";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  // No permission check — this page is about the viewer's own account.
  const viewer = await requireUser();
  const profile = await getProfile(viewer.id);

  return (
    <>
      <PageHeader title="My account" description="Your name, password and access." />
      <ProfileManager profile={profile} />
    </>
  );
}
