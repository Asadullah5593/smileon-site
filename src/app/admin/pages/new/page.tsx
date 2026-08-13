import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { listBanners } from "@/features/banners/server/banner-repository";
import { listFaqGroups } from "@/features/faqs/server/faq-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { PageForm } from "@/features/pages/components/PageForm";

export const metadata: Metadata = { title: "New page" };
export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  await requirePermission("pages.create");

  // Block settings offer the banners and FAQ groups that actually exist.
  const [banners, faqGroups] = await Promise.all([listBanners(), listFaqGroups()]);

  return (
    <>
      <PageHeader title="New page" description="It stays a draft until you publish it." />
      <PageForm banners={banners} faqGroups={faqGroups} />
    </>
  );
}
