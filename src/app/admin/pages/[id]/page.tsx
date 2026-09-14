import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { requirePermission } from "@/shared/auth/permissions";
import { getPageById } from "@/features/pages/server/page-repository";
import { NotFoundError } from "@/shared/api/errors";
import { listBanners } from "@/features/banners/server/banner-repository";
import { listFaqGroups } from "@/features/faqs/server/faq-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { PageForm } from "@/features/pages/components/PageForm";
import { Button } from "@/shared/ui/primitives/button";

export const metadata: Metadata = { title: "Edit page" };
export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[id]">) {
  await requirePermission("pages.update");
  const { id } = await params;

  const page = await getPageById(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const [banners, faqGroups] = await Promise.all([listBanners(), listFaqGroups()]);

  return (
    <>
      <PageHeader
        title={page.title}
        description={`Last updated ${new Date(page.updatedAt).toLocaleString()}`}
        actions={
          page.status === "PUBLISHED" ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${page.slug}`} target="_blank">
                View live <ExternalLink className="ml-1 size-3.5" />
              </Link>
            </Button>
          ) : null
        }
      />
      <PageForm page={page} banners={banners} faqGroups={faqGroups} />
    </>
  );
}
