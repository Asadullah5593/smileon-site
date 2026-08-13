import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import {
  testimonialCreateSchema,
  testimonialListQuerySchema,
} from "@/features/testimonials/schemas";
import {
  createTestimonial,
  listTestimonials,
} from "@/features/testimonials/server/testimonial-repository";

export const GET = createRouteHandler(
  { permission: "testimonials.read", query: testimonialListQuerySchema },
  async ({ query }) => ok(await listTestimonials(query)),
);

export const POST = createRouteHandler(
  { permission: "testimonials.create", body: testimonialCreateSchema },
  async ({ body, viewer }) => created(await createTestimonial(body, viewer)),
);
