import { apiFetch } from "@/shared/api/http";
import type {
  LocationCreateInput,
  LocationDto,
  LocationUpdateInput,
} from "@/features/locations/schemas";

export const locationKeys = {
  all: ["locations"] as const,
};

export const locationsApi = {
  list: () => apiFetch<LocationDto[]>("/api/admin/locations"),

  create: (body: LocationCreateInput) =>
    apiFetch<LocationDto>("/api/admin/locations", { method: "POST", body }),

  update: (id: string, body: LocationUpdateInput) =>
    apiFetch<LocationDto>(`/api/admin/locations/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/locations/${id}`, { method: "DELETE" }),
};
