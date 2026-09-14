import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type { AppointmentDto } from "@/features/appointments/schemas";

export type AppointmentsListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  appointmentStatus?: string;
  from?: string;
  to?: string;
};

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: (params: AppointmentsListParams) => [...appointmentKeys.all, "list", params] as const,
};

export const appointmentsApi = {
  list: (params: AppointmentsListParams) =>
    apiFetch<Paginated<AppointmentDto>>(`/api/admin/appointments${toQueryString(params)}`),

  setStatus: (id: string, status: string) =>
    apiFetch<AppointmentDto>(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      body: { status },
    }),

  remove: (id: string) => apiFetch<void>(`/api/admin/appointments/${id}`, { method: "DELETE" }),

  /** The export is a file download, so it is a link rather than a fetch. */
  exportUrl: (params: AppointmentsListParams) =>
    `/api/admin/appointments/export${toQueryString(params)}`,
};
