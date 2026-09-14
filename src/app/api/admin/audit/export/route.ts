import { createRouteHandler } from "@/shared/api/route-handler";
import { csvResponse, toCsv } from "@/shared/api/csv";
import { auditListQuerySchema } from "@/features/audit/schemas";
import { listAuditEntriesForExport } from "@/features/audit/server/audit-repository";

const HEADERS = ["When", "Actor", "Action", "Entity", "Record", "Summary", "Changes"];

export const GET = createRouteHandler(
  { permission: "audit.read", query: auditListQuerySchema },
  async ({ query }) => {
    const rows = await listAuditEntriesForExport(query);

    const csv = toCsv(
      HEADERS,
      rows.map((entry) => [
        entry.createdAt,
        entry.actorName ?? "(deleted user)",
        entry.action,
        entry.entity,
        entry.entityId,
        entry.summary,
        entry.diff ? JSON.stringify(entry.diff) : "",
      ]),
    );

    const today = new Date().toISOString().slice(0, 10);
    return csvResponse(`audit-log-${today}.csv`, csv);
  },
);
