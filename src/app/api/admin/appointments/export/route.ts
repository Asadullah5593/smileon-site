import { createRouteHandler } from "@/shared/api/route-handler";
import { csvResponse, toCsv } from "@/shared/api/csv";
import { appointmentListQuerySchema } from "@/features/appointments/schemas";
import { listAppointmentsForExport } from "@/features/appointments/server/appointment-repository";
import { recordAudit } from "@/shared/audit/audit-log";

const HEADERS = [
  "Received",
  "Name",
  "Phone",
  "Email",
  "Treatment",
  "Location",
  "Preferred date",
  "Preferred time",
  "Status",
  "Message",
  "Internal note",
];

/**
 * CSV of every appointment matching the current filters — the same `where` the
 * list uses, so an export contains exactly what the operator is looking at.
 *
 * Exports leave the building with patient contact details, so this one is
 * audited even though it is a read.
 */
export const GET = createRouteHandler(
  { permission: "appointments.export", query: appointmentListQuerySchema },
  async ({ query, viewer }) => {
    const rows = await listAppointmentsForExport(query);

    await recordAudit({
      actorId: viewer.id,
      action: "appointments.export",
      entity: "Appointment",
      summary: `Exported ${rows.length} appointment(s)`,
      diff: { filters: query },
    });

    const csv = toCsv(
      HEADERS,
      rows.map((a) => [
        new Date(a.createdAt).toISOString(),
        a.name,
        a.phone,
        a.email,
        a.serviceTitle,
        a.locationName,
        a.preferredDate ? a.preferredDate.slice(0, 10) : "",
        a.preferredTime,
        a.status,
        a.message,
        a.internalNote,
      ]),
    );

    const today = new Date().toISOString().slice(0, 10);
    return csvResponse(`appointments-${today}.csv`, csv);
  },
);
