import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { AppointmentsInbox } from "@/features/appointments/components/AppointmentsInbox";

export const metadata: Metadata = { title: "Appointments" };

export default async function AdminAppointmentsPage() {
  await requirePermission("appointments.read");

  return (
    <>
      <PageHeader
        title="Appointment requests"
        description="Everything submitted through the website booking form."
      />
      <AppointmentsInbox />
    </>
  );
}
