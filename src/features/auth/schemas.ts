import { z } from "zod";

/** Minimum length shared by every place a password is set. */
const password = z.string().min(10, "Use at least 10 characters.").max(200);

export const inviteCreateSchema = z.object({
  email: z.email("Enter a valid email address.").transform((v) => v.toLowerCase()),
  name: z.string().trim().min(2, "What is their name?").max(120),
  roleIds: z.array(z.string()).min(1, "Give them at least one role."),
});

/** What the invitee submits to claim their account. */
export const inviteAcceptSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string().min(1),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  });

export const passwordResetRequestSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string().min(1),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  });

export type InviteCreateInput = z.output<typeof inviteCreateSchema>;
export type InviteAcceptInput = z.output<typeof inviteAcceptSchema>;
export type PasswordResetRequestInput = z.output<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.output<typeof passwordResetSchema>;

export type InvitationDto = {
  id: string;
  email: string;
  invitedByName: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

/** How long an invitation and a reset link stay usable. */
export const INVITE_TTL_HOURS = 72;
export const RESET_TTL_HOURS = 1;
