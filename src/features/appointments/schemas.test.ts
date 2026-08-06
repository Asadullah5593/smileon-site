import { describe, expect, it } from "vitest";
import { appointmentRequestSchema, contactMessageSchema } from "@/features/appointments/schemas";

const valid = { name: "Ayesha Khan", phone: "0300 1234567" };

describe("appointmentRequestSchema", () => {
  it("accepts a minimal booking", () => {
    expect(appointmentRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a plausible phone number", () => {
    expect(appointmentRequestSchema.safeParse({ ...valid, phone: "call me" }).success).toBe(false);
  });

  it("treats optional fields as empty strings", () => {
    const result = appointmentRequestSchema.safeParse({ ...valid, email: "", preferredDate: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(appointmentRequestSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  // The honeypot must PASS validation when filled — the route discards those
  // submissions silently. Rejecting here would hand a bot a 422 telling it
  // exactly which field to clear.
  it("accepts a filled honeypot so the route can discard it silently", () => {
    const result = appointmentRequestSchema.safeParse({ ...valid, website: "http://spam.example" });
    expect(result.success).toBe(true);
    expect(result.data?.website).toBe("http://spam.example");
  });

  it("leaves the honeypot undefined when omitted", () => {
    expect(appointmentRequestSchema.parse(valid).website).toBeUndefined();
  });
});

describe("contactMessageSchema", () => {
  const message = { name: "Ali", email: "ali@example.com", message: "I would like a check-up." };

  it("accepts a complete message", () => {
    expect(contactMessageSchema.safeParse(message).success).toBe(true);
  });

  it("rejects a too-short message", () => {
    expect(contactMessageSchema.safeParse({ ...message, message: "hi" }).success).toBe(false);
  });

  it("accepts a filled honeypot", () => {
    expect(contactMessageSchema.safeParse({ ...message, website: "spam" }).success).toBe(true);
  });
});
