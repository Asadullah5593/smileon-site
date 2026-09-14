import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type {
  RedirectCreateInput,
  RedirectDto,
  RedirectUpdateInput,
} from "@/features/redirects/schemas";

export type RedirectsListParams = { page?: number; pageSize?: number; q?: string };

export const redirectKeys = {
  all: ["redirects"] as const,
  list: (params: RedirectsListParams) => [...redirectKeys.all, "list", params] as const,
};

export type ImportResult = {
  created: number;
  skipped: number;
  errors: { line: number; text: string; reason: string }[];
};

export const redirectsApi = {
  list: (params: RedirectsListParams) =>
    apiFetch<Paginated<RedirectDto>>(`/api/admin/redirects${toQueryString(params)}`),

  create: (body: RedirectCreateInput) =>
    apiFetch<RedirectDto>("/api/admin/redirects", { method: "POST", body }),

  update: (id: string, body: RedirectUpdateInput) =>
    apiFetch<RedirectDto>(`/api/admin/redirects/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/redirects/${id}`, { method: "DELETE" }),

  import: (text: string) =>
    apiFetch<ImportResult>("/api/admin/redirects/import", { method: "POST", body: { text } }),
};
