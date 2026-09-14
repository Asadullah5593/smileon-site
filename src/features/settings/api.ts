import { apiFetch } from "@/shared/api/http";
import type { SettingKey, SettingValues } from "@/features/settings/schemas";

export const settingKeys = { all: ["settings"] as const };

export const settingsApi = {
  getAll: () => apiFetch<SettingValues>("/api/admin/settings"),

  update: <K extends SettingKey>(key: K, body: SettingValues[K]) =>
    apiFetch<SettingValues[K]>(`/api/admin/settings/${key}`, { method: "PUT", body }),
};
