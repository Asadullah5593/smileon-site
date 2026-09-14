import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";
import { orderedStatusSchema, slugSchema, type PublishStatus } from "@/shared/content/publishable";

/** The social links a clinician profile can carry. */
export const socialsSchema = z.object({
  facebook: z.string().max(300).nullish(),
  instagram: z.string().max(300).nullish(),
  linkedin: z.string().max(300).nullish(),
  x: z.string().max(300).nullish(),
});

const stringList = z.array(z.string().trim().min(1).max(160)).max(30).default([]);

export const teamCreateSchema = z.object({
  name: z.string().trim().min(2, "Give the team member a name.").max(160),
  slug: slugSchema,
  designation: z.string().trim().max(160).nullish(),
  bioHtml: z.string().max(100_000).nullish(),
  photoId: z.string().nullish(),
  qualifications: stringList,
  specialties: stringList,
  socials: socialsSchema.nullish(),
  ...orderedStatusSchema.shape,
});

export const teamUpdateSchema = teamCreateSchema.partial();

export const teamListQuerySchema = listQuerySchema;

export type TeamCreateInput = z.output<typeof teamCreateSchema>;
export type TeamUpdateInput = z.output<typeof teamUpdateSchema>;
export type TeamFormValues = z.input<typeof teamCreateSchema>;
export type TeamListQuery = z.infer<typeof teamListQuerySchema>;
export type Socials = z.output<typeof socialsSchema>;

export type TeamMemberDto = {
  id: string;
  slug: string;
  name: string;
  designation: string | null;
  bioHtml: string | null;
  photoId: string | null;
  photoUrl: string | null;
  qualifications: string[];
  specialties: string[];
  socials: Socials | null;
  sortOrder: number;
  status: PublishStatus;
  updatedAt: string;
};
