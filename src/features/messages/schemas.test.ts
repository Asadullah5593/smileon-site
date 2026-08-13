import { describe, expect, it } from "vitest";
import {
  contactMessageSchema,
  messageListQuerySchema,
  messageUpdateSchema,
} from "@/features/messages/schemas";

describe("contactMessageSchema", () => {
  const message = { name: "Ali", email: "ali@example.com", message: "I would like a check-up." };

  it("accepts a complete message", () => {
    expect(contactMessageSchema.safeParse(message).success).toBe(true);
  });

  it("rejects a too-short message", () => {
    expect(contactMessageSchema.safeParse({ ...message, message: "hi" }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(contactMessageSchema.safeParse({ ...message, email: "nope" }).success).toBe(false);
  });

  // Must PASS when filled — the route discards those submissions silently.
  // Rejecting here would hand a bot a 422 naming the field to clear.
  it("accepts a filled honeypot", () => {
    expect(contactMessageSchema.safeParse({ ...message, website: "spam" }).success).toBe(true);
  });
});

describe("messageListQuerySchema", () => {
  it("defaults to the first page", () => {
    expect(messageListQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
  });

  it("accepts a read filter", () => {
    expect(messageListQuerySchema.parse({ read: "false" }).read).toBe("false");
  });

  it("rejects a non-boolean read filter", () => {
    expect(messageListQuerySchema.safeParse({ read: "maybe" }).success).toBe(false);
  });

  it("caps pageSize so one request can't pull the table", () => {
    expect(messageListQuerySchema.safeParse({ pageSize: 5000 }).success).toBe(false);
  });
});

describe("messageUpdateSchema", () => {
  it("only accepts the read flag", () => {
    expect(messageUpdateSchema.parse({ isRead: true })).toEqual({ isRead: true });
  });

  it("requires isRead", () => {
    expect(messageUpdateSchema.safeParse({}).success).toBe(false);
  });
});
