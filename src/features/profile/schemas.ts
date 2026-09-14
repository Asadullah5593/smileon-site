import { z } from "zod";

/**
 * Self-service account editing.
 *
 * Note what is absent: no `id`, no `roleIds`, no `isActive`. The endpoint acts
 * on `viewer.id` alone. Accepting an id here would turn the one route without a
 * permission gate into privilege escalation.
 */
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "What should we call you?").max(120),
  image: z.string().trim().max(1000).nullish(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(10, "Use at least 10 characters.").max(200),
    confirmPassword: z.string().min(1, "Repeat the new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "Choose a password you haven't used here before.",
    path: ["newPassword"],
  });

export type ProfileUpdateInput = z.output<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.output<typeof passwordChangeSchema>;

export type ProfileDto = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  roles: { id: string; name: string }[];
  lastLoginAt: string | null;
};
