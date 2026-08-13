import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type { PostCreateInput, PostDto, PostUpdateInput } from "@/features/posts/schemas";

export type PostsListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  categoryId?: string;
};

export const postKeys = {
  all: ["posts"] as const,
  list: (params: PostsListParams) => [...postKeys.all, "list", params] as const,
};

export const postsApi = {
  list: (params: PostsListParams) =>
    apiFetch<Paginated<PostDto>>(`/api/admin/posts${toQueryString(params)}`),

  create: (body: PostCreateInput) =>
    apiFetch<PostDto>("/api/admin/posts", { method: "POST", body }),

  update: (id: string, body: PostUpdateInput) =>
    apiFetch<PostDto>(`/api/admin/posts/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/posts/${id}`, { method: "DELETE" }),
};
