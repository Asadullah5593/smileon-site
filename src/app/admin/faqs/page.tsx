import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { listFaqGroups } from "@/features/faqs/server/faq-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { FaqsManager } from "@/features/faqs/components/FaqsManager";

export const metadata: Metadata = { title: "FAQs" };
export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  await requirePermission("faqs.read");
  const groups = await listFaqGroups();

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Answers shown on the homepage and alongside treatments. Grouped so one set can serve several pages."
      />
      <FaqsManager groups={groups} />
    </>
  );
}
