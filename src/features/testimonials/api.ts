import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import type {
  TestimonialCreateInput,
  TestimonialDto,
  TestimonialUpdateInput,
} from "@/features/testimonials/schemas";

export type TestimonialsListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  serviceId?: string;
};

export const testimonialKeys = {
  all: ["testimonials"] as const,
  list: (params: TestimonialsListParams) => [...testimonialKeys.all, "list", params] as const,
};

export const testimonialsApi = {
  list: (params: TestimonialsListParams) =>
    apiFetch<Paginated<TestimonialDto>>(`/api/admin/testimonials${toQueryString(params)}`),

  create: (body: TestimonialCreateInput) =>
    apiFetch<TestimonialDto>("/api/admin/testimonials", { method: "POST", body }),

  update: (id: string, body: TestimonialUpdateInput) =>
    apiFetch<TestimonialDto>(`/api/admin/testimonials/${id}`, { method: "PATCH", body }),

  remove: (id: string) => apiFetch<void>(`/api/admin/testimonials/${id}`, { method: "DELETE" }),
};
