import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type { PageCreateInput, PageDto, PageUpdateInput } from "@/features/pages/schemas";

export type PagesListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
};

export const pageKeys = {
  all: ["pages"] as const,
  list: (params: PagesListParams) => [...pageKeys.all, "list", params] as const,
};

export const pagesApi = {
  list: (params: PagesListParams) =>
    apiFetch<Paginated<PageDto>>(`/api/admin/pages${toQueryString(params)}`),

  create: (body: PageCreateInput) =>
    apiFetch<PageDto>("/api/admin/pages", { method: "POST", body }),

  update: (id: string, body: PageUpdateInput) =>
    apiFetch<PageDto>(`/api/admin/pages/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/pages/${id}`, { method: "DELETE" }),
};
