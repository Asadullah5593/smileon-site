import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { ServiceForm } from "@/features/services/components/ServiceForm";

export const metadata: Metadata = { title: "New treatment" };

export default async function NewServicePage() {
  await requirePermission("services.create");

  return (
    <>
      <PageHeader title="New treatment" description="It stays a draft until you publish it." />
      <ServiceForm />
    </>
  );
}
