import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type { MediaDto, MediaUpdateInput } from "@/features/media/schemas";

export const mediaKeys = {
  all: ["media"] as const,
  list: (params: Record<string, unknown>) => [...mediaKeys.all, "list", params] as const,
  folders: ["media", "folders"] as const,
};

export const mediaApi = {
  list: (params: { page?: number; pageSize?: number; q?: string; folder?: string }) =>
    apiFetch<Paginated<MediaDto>>(`/api/media${toQueryString(params)}`),

  folders: () => apiFetch<string[]>("/api/media/folders"),

  upload: (file: File, folder?: string) => {
    const form = new FormData();
    form.set("file", file);
    if (folder) form.set("folder", folder);
    return apiFetch<MediaDto>("/api/media", { method: "POST", body: form });
  },

  update: (id: string, body: MediaUpdateInput) =>
    apiFetch<MediaDto>(`/api/media/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/media/${id}`, { method: "DELETE" }),
};
