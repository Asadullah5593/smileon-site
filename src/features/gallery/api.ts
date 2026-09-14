import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type {
  GalleryCaseDto,
  GalleryCreateInput,
  GalleryUpdateInput,
} from "@/features/gallery/schemas";

export type GalleryListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  serviceId?: string;
};

export const galleryKeys = {
  all: ["gallery"] as const,
  list: (params: GalleryListParams) => [...galleryKeys.all, "list", params] as const,
};

export const galleryApi = {
  list: (params: GalleryListParams) =>
    apiFetch<Paginated<GalleryCaseDto>>(`/api/admin/gallery${toQueryString(params)}`),

  create: (body: GalleryCreateInput) =>
    apiFetch<GalleryCaseDto>("/api/admin/gallery", { method: "POST", body }),

  update: (id: string, body: GalleryUpdateInput) =>
    apiFetch<GalleryCaseDto>(`/api/admin/gallery/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/gallery/${id}`, { method: "DELETE" }),
};
