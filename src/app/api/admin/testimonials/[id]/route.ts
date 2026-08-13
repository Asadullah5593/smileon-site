import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { testimonialUpdateSchema } from "@/features/testimonials/schemas";
import {
  deleteTestimonial,
  getTestimonialById,
  updateTestimonial,
} from "@/features/testimonials/server/testimonial-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "testimonials.read", params: paramsSchema },
  async ({ params }) => ok(await getTestimonialById(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "testimonials.update", params: paramsSchema, body: testimonialUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateTestimonial(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "testimonials.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteTestimonial(params.id, viewer);
    return noContent();
  },
);
