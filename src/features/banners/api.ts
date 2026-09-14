import { apiFetch } from "@/shared/api/http";
import type { BannerCreateInput, BannerDto, BannerUpdateInput } from "@/features/banners/schemas";

export const bannerKeys = { all: ["banners"] as const };

export const bannersApi = {
  list: () => apiFetch<BannerDto[]>("/api/admin/banners"),

  create: (body: BannerCreateInput) =>
    apiFetch<BannerDto>("/api/admin/banners", { method: "POST", body }),

  update: (id: string, body: BannerUpdateInput) =>
    apiFetch<BannerDto>(`/api/admin/banners/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/banners/${id}`, { method: "DELETE" }),
};
