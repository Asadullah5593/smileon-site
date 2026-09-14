import { createRouteHandler } from "@/shared/api/route-handler";
import { ok } from "@/shared/api/response";
import { auditListQuerySchema } from "@/features/audit/schemas";
import { listAuditEntries } from "@/features/audit/server/audit-repository";

// GET only, deliberately: an audit trail with a write endpoint isn't one.
export const GET = createRouteHandler(
  { permission: "audit.read", query: auditListQuerySchema },
  async ({ query }) => ok(await listAuditEntries(query)),
);
