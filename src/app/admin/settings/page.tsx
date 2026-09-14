import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { getAllSettings } from "@/features/settings/server/settings-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { SettingsManager } from "@/features/settings/components/SettingsManager";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePermission("settings.read");
  const settings = await getAllSettings();

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Brand, contact details, social links, SEO defaults and analytics ids."
      />
      <SettingsManager settings={settings} />
    </>
  );
}
