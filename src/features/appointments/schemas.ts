import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";

export const appointmentRequestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a reachable phone number.")
    .max(30)
    .regex(/^[+0-9()\s-]+$/, "Use digits, spaces, +, - and () only."),
  email: z.email("Enter a valid email address.").optional().or(z.literal("")),
  serviceId: z.string().optional().or(z.literal("")),
  locationId: z.string().optional().or(z.literal("")),
  preferredDate: z.iso.date().optional().or(z.literal("")),
  preferredTime: z.string().max(20).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  /**
   * Honeypot: real people leave it empty, bots fill everything in. It must
   * *accept* a filled value — the route silently discards those submissions, so
   * a bot sees the same 201 a human does instead of a validation error telling
   * it what to fix.
   */
  website: z.string().max(200).optional(),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email("Enter a valid email address."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a little more.").max(4000),
  /** Honeypot — see the note on `appointmentRequestSchema.website`. */
  website: z.string().max(200).optional(),
});

export const appointmentListQuerySchema = listQuerySchema.extend({
  appointmentStatus: z.enum(["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  internalNote: z.string().max(2000).nullish(),
});

export type AppointmentRequestInput = z.infer<typeof appointmentRequestSchema>;
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
