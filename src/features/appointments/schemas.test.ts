import { describe, expect, it } from "vitest";
import {
  appointmentListQuerySchema,
  appointmentRequestSchema,
} from "@/features/appointments/schemas";

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

describe("appointmentListQuerySchema", () => {
  it("defaults to the first page", () => {
    expect(appointmentListQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
  });

  it("accepts an ISO date range", () => {
    const result = appointmentListQuerySchema.safeParse({ from: "2026-01-01", to: "2026-01-31" });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed date so the export can't be fed junk", () => {
    expect(appointmentListQuerySchema.safeParse({ from: "01/01/2026" }).success).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(appointmentListQuerySchema.safeParse({ appointmentStatus: "PENDING" }).success).toBe(
      false,
    );
  });
});
