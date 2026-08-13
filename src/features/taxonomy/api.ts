import { apiFetch, toQueryString } from "@/shared/api/http";
import type {
  TaxonomyCreateInput,
  TaxonomyKind,
  TaxonomyTermDto,
  TaxonomyUpdateInput,
} from "@/features/taxonomy/schemas";

export const taxonomyKeys = {
  all: ["taxonomy"] as const,
  list: (kind: TaxonomyKind, q?: string) => [...taxonomyKeys.all, kind, q ?? ""] as const,
};

export const taxonomyApi = {
  list: (kind: TaxonomyKind, q?: string) =>
    apiFetch<TaxonomyTermDto[]>(`/api/admin/taxonomy${toQueryString({ kind, q })}`),

  create: (body: TaxonomyCreateInput) =>
    apiFetch<TaxonomyTermDto>("/api/admin/taxonomy", { method: "POST", body }),

  update: (id: string, body: TaxonomyUpdateInput) =>
    apiFetch<TaxonomyTermDto>(`/api/admin/taxonomy/${id}`, { method: "PATCH", body }),

  remove: (id: string, kind: TaxonomyKind) =>
    apiFetch<void>(`/api/admin/taxonomy/${id}${toQueryString({ kind })}`, { method: "DELETE" }),
};
