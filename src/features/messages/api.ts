import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type { MessageDto } from "@/features/messages/schemas";

export type MessagesListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  read?: "true" | "false";
};

export const messageKeys = {
  all: ["messages"] as const,
  list: (params: MessagesListParams) => [...messageKeys.all, "list", params] as const,
};

export const messagesApi = {
  list: (params: MessagesListParams) =>
    apiFetch<Paginated<MessageDto>>(`/api/admin/messages${toQueryString(params)}`),

  setRead: (id: string, isRead: boolean) =>
    apiFetch<MessageDto>(`/api/admin/messages/${id}`, { method: "PATCH", body: { isRead } }),

  remove: (id: string) => apiFetch<void>(`/api/admin/messages/${id}`, { method: "DELETE" }),
};
