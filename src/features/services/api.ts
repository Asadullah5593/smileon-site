import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type {
  ServiceCreateInput,
  ServiceDto,
  ServiceUpdateInput,
} from "@/features/services/schemas";

export type ServicesListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
};

/** Query-key factory — every services query hangs off this so invalidation is one call. */
export const serviceKeys = {
  all: ["services"] as const,
  list: (params: ServicesListParams) => [...serviceKeys.all, "list", params] as const,
  detail: (id: string) => [...serviceKeys.all, "detail", id] as const,
};

export const servicesApi = {
  list: (params: ServicesListParams) =>
    apiFetch<Paginated<ServiceDto>>(`/api/admin/services${toQueryString(params)}`),

  get: (id: string) => apiFetch<ServiceDto>(`/api/admin/services/${id}`),

  create: (body: ServiceCreateInput) =>
    apiFetch<ServiceDto>("/api/admin/services", { method: "POST", body }),

  update: (id: string, body: ServiceUpdateInput) =>
    apiFetch<ServiceDto>(`/api/admin/services/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/services/${id}`, { method: "DELETE" }),
};
