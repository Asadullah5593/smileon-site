import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { requirePermission } from "@/shared/auth/permissions";
import { getServiceById } from "@/features/services/server/service-repository";
import { NotFoundError } from "@/shared/api/errors";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { ServiceForm } from "@/features/services/components/ServiceForm";
import { Button } from "@/shared/ui/primitives/button";

export const metadata: Metadata = { title: "Edit treatment" };

export default async function EditServicePage({ params }: PageProps<"/admin/services/[id]">) {
  await requirePermission("services.update");
  const { id } = await params;

  const service = await getServiceById(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        title={service.title}
        description={`Last updated ${new Date(service.updatedAt).toLocaleString()}`}
        actions={
          service.status === "PUBLISHED" ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/services/${service.slug}`} target="_blank">
                View live <ExternalLink className="ml-1 size-3.5" />
              </Link>
            </Button>
          ) : null
        }
      />
      <ServiceForm service={service} />
    </>
  );
}
