import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type { TeamCreateInput, TeamMemberDto, TeamUpdateInput } from "@/features/team/schemas";

export type TeamListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
};

export const teamKeys = {
  all: ["team"] as const,
  list: (params: TeamListParams) => [...teamKeys.all, "list", params] as const,
};

export const teamApi = {
  list: (params: TeamListParams) =>
    apiFetch<Paginated<TeamMemberDto>>(`/api/admin/team${toQueryString(params)}`),

  create: (body: TeamCreateInput) =>
    apiFetch<TeamMemberDto>("/api/admin/team", { method: "POST", body }),

  update: (id: string, body: TeamUpdateInput) =>
    apiFetch<TeamMemberDto>(`/api/admin/team/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/team/${id}`, { method: "DELETE" }),
};
