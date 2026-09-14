import { apiFetch } from "@/shared/api/http";
import type {
  PasswordChangeInput,
  ProfileDto,
  ProfileUpdateInput,
} from "@/features/profile/schemas";

export const profileKeys = { all: ["profile"] as const };

export const profileApi = {
  get: () => apiFetch<ProfileDto>("/api/admin/profile"),

  update: (body: ProfileUpdateInput) =>
    apiFetch<ProfileDto>("/api/admin/profile", { method: "PATCH", body }),

  changePassword: (body: PasswordChangeInput) =>
    apiFetch<void>("/api/admin/profile/password", { method: "POST", body }),
};
