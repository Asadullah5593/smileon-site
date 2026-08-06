import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type {
  RoleCreateInput,
  RoleDto,
  RoleUpdateInput,
  UserCreateInput,
  UserDto,
  UserUpdateInput,
} from "@/features/access/schemas";

export const accessKeys = {
  roles: ["roles"] as const,
  users: (params: Record<string, unknown>) => ["users", params] as const,
};

export const rolesApi = {
  list: () => apiFetch<RoleDto[]>("/api/admin/roles"),
  create: (body: RoleCreateInput) => apiFetch<RoleDto>("/api/admin/roles", { method: "POST", body }),
  update: (id: string, body: RoleUpdateInput) =>
    apiFetch<RoleDto>(`/api/admin/roles/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch<void>(`/api/admin/roles/${id}`, { method: "DELETE" }),
};

export const usersApi = {
  list: (params: { page?: number; q?: string; roleId?: string }) =>
    apiFetch<Paginated<UserDto>>(`/api/admin/users${toQueryString(params)}`),
  create: (body: UserCreateInput) => apiFetch<UserDto>("/api/admin/users", { method: "POST", body }),
  update: (id: string, body: UserUpdateInput) =>
    apiFetch<UserDto>(`/api/admin/users/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch<void>(`/api/admin/users/${id}`, { method: "DELETE" }),
};
