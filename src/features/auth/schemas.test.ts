import { describe, expect, it } from "vitest";
import {
  inviteAcceptSchema,
  inviteCreateSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from "@/features/auth/schemas";

describe("inviteCreateSchema", () => {
  const valid = { email: "New.Person@Example.com", name: "New Person", roleIds: ["r1"] };

  it("lowercases the email so it matches the unique column", () => {
    expect(inviteCreateSchema.parse(valid).email).toBe("new.person@example.com");
  });

  // An account with no roles can sign in and do nothing — better to catch it here.
  it("requires at least one role", () => {
    expect(inviteCreateSchema.safeParse({ ...valid, roleIds: [] }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(inviteCreateSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });
});

describe("inviteAcceptSchema", () => {
  const valid = { token: "t", password: "correct-horse", confirmPassword: "correct-horse" };

  it("accepts a matching pair", () => {
    expect(inviteAcceptSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a mismatch, pointing at the confirm field", () => {
    const result = inviteAcceptSchema.safeParse({ ...valid, confirmPassword: "different" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("enforces a minimum length", () => {
    expect(
      inviteAcceptSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" })
        .success,
    ).toBe(false);
  });

  it("requires a token", () => {
    expect(inviteAcceptSchema.safeParse({ ...valid, token: "" }).success).toBe(false);
  });
});

describe("passwordResetRequestSchema", () => {
  it("lowercases the email", () => {
    expect(passwordResetRequestSchema.parse({ email: "ME@Example.COM" }).email).toBe(
      "me@example.com",
    );
  });
});

describe("passwordResetSchema", () => {
  it("applies the same rules as accepting an invitation", () => {
    const valid = { token: "t", password: "correct-horse", confirmPassword: "correct-horse" };
    expect(passwordResetSchema.safeParse(valid).success).toBe(true);
    expect(passwordResetSchema.safeParse({ ...valid, confirmPassword: "nope" }).success).toBe(
      false,
    );
  });
});
