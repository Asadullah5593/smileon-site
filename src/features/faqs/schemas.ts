import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";
import { orderedStatusSchema, type PublishStatus } from "@/shared/content/publishable";

/** Groups let one FAQ set serve the homepage, the pricing page, and so on. */
export const FAQ_GROUPS = ["general", "treatments", "payment", "safety"] as const;

export const faqCreateSchema = z.object({
  question: z.string().trim().min(5, "Write the question as a patient would ask it.").max(300),
  answerHtml: z.string().trim().min(1, "Give the question an answer.").max(20_000),
  group: z.string().trim().min(1).max(40).default("general"),
  ...orderedStatusSchema.shape,
});

export const faqUpdateSchema = faqCreateSchema.partial();

export const faqListQuerySchema = listQuerySchema.extend({
  group: z.string().max(40).optional(),
});

export type FaqCreateInput = z.output<typeof faqCreateSchema>;
export type FaqUpdateInput = z.output<typeof faqUpdateSchema>;
export type FaqFormValues = z.input<typeof faqCreateSchema>;
export type FaqListQuery = z.infer<typeof faqListQuerySchema>;

export type FaqDto = {
  id: string;
  question: string;
  answerHtml: string;
  group: string;
  sortOrder: number;
  status: PublishStatus;
  updatedAt: string;
};
