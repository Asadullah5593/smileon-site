import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type { FaqCreateInput, FaqDto, FaqUpdateInput } from "@/features/faqs/schemas";

export type FaqsListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  group?: string;
};

export const faqKeys = {
  all: ["faqs"] as const,
  list: (params: FaqsListParams) => [...faqKeys.all, "list", params] as const,
};

export const faqsApi = {
  list: (params: FaqsListParams) =>
    apiFetch<Paginated<FaqDto>>(`/api/admin/faqs${toQueryString(params)}`),

  create: (body: FaqCreateInput) => apiFetch<FaqDto>("/api/admin/faqs", { method: "POST", body }),

  update: (id: string, body: FaqUpdateInput) =>
    apiFetch<FaqDto>(`/api/admin/faqs/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/faqs/${id}`, { method: "DELETE" }),
};
