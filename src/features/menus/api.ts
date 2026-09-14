import { apiFetch } from "@/shared/api/http";
import type {
  MenuCreateInput,
  MenuDto,
  MenuItemCreateInput,
  MenuItemUpdateInput,
  MenuReorderInput,
} from "@/features/menus/schemas";

export const menuKeys = { all: ["menus"] as const };

export const menusApi = {
  list: () => apiFetch<MenuDto[]>("/api/admin/menus"),

  create: (body: MenuCreateInput) =>
    apiFetch<MenuDto>("/api/admin/menus", { method: "POST", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/menus/${id}`, { method: "DELETE" }),

  createItem: (body: MenuItemCreateInput) =>
    apiFetch<unknown>("/api/admin/menu-items", { method: "POST", body }),

  updateItem: (id: string, body: MenuItemUpdateInput) =>
    apiFetch<unknown>(`/api/admin/menu-items/${id}`, { method: "PATCH", body }),

  removeItem: (id: string) => apiFetch<void>(`/api/admin/menu-items/${id}`, { method: "DELETE" }),

  reorder: (body: MenuReorderInput) =>
    apiFetch<void>("/api/admin/menu-items/reorder", { method: "POST", body }),
};
