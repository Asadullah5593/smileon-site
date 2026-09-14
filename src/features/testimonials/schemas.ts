import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";
import { orderedStatusSchema, type PublishStatus } from "@/shared/content/publishable";

export const testimonialCreateSchema = z.object({
  patientName: z.string().trim().min(2, "Whose words are these?").max(120),
  quote: z.string().trim().min(10, "Quote the patient in their own words.").max(2000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  photoId: z.string().nullish(),
  serviceId: z.string().nullish(),
  ...orderedStatusSchema.shape,
});

export const testimonialUpdateSchema = testimonialCreateSchema.partial();

export const testimonialListQuerySchema = listQuerySchema.extend({
  serviceId: z.string().optional(),
});

export type TestimonialCreateInput = z.output<typeof testimonialCreateSchema>;
export type TestimonialUpdateInput = z.output<typeof testimonialUpdateSchema>;
export type TestimonialFormValues = z.input<typeof testimonialCreateSchema>;
export type TestimonialListQuery = z.infer<typeof testimonialListQuerySchema>;

export type TestimonialDto = {
  id: string;
  patientName: string;
  quote: string;
  rating: number;
  photoId: string | null;
  photoUrl: string | null;
  serviceId: string | null;
  serviceTitle: string | null;
  sortOrder: number;
  status: PublishStatus;
  updatedAt: string;
};
