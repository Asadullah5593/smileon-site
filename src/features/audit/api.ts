import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type { AuditEntryDto } from "@/features/audit/schemas";

export type AuditListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  actorId?: string;
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
};

export const auditKeys = {
  all: ["audit"] as const,
  list: (params: AuditListParams) => [...auditKeys.all, "list", params] as const,
};

export const auditApi = {
  list: (params: AuditListParams) =>
    apiFetch<Paginated<AuditEntryDto>>(`/api/admin/audit${toQueryString(params)}`),

  /** A file download, so it is a link rather than a fetch. */
  exportUrl: (params: AuditListParams) => `/api/admin/audit/export${toQueryString(params)}`,
};
