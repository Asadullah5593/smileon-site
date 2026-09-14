import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";

/**
 * Contact messages sent from the public site.
 *
 * The public submission schema lives here rather than in the appointments
 * slice: `ContactMessage` is this module's table, and only this module's
 * repository touches it.
 */
export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email("Enter a valid email address."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a little more.").max(4000),
  /**
   * Honeypot: real people leave it empty, bots fill everything in. It must
   * *accept* a filled value — the route silently discards those submissions, so
   * a bot sees the same 201 a human does instead of a validation error telling
   * it what to fix.
   */
  website: z.string().max(200).optional(),
});

export const messageListQuerySchema = listQuerySchema.extend({
  read: z.enum(["true", "false"]).optional(),
});

export const messageUpdateSchema = z.object({
  isRead: z.boolean(),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type MessageListQuery = z.infer<typeof messageListQuerySchema>;
export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>;

export type MessageDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};
