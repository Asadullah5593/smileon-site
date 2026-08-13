import { describe, expect, it } from "vitest";
import { passwordChangeSchema, profileUpdateSchema } from "@/features/profile/schemas";

describe("profileUpdateSchema", () => {
  it("accepts a name change", () => {
    expect(profileUpdateSchema.parse({ name: "Ayesha Khan" }).name).toBe("Ayesha Khan");
  });

  /**
   * The guard that keeps the one unauthenticated-by-permission route safe: the
   * endpoint acts on `viewer.id`, and the schema must not give a caller any way
   * to name a different account or grant itself anything.
   */
  it("strips id, roleIds and isActive if they are sent", () => {
    const parsed = profileUpdateSchema.parse({
      name: "Attacker",
      id: "someone-else",
      roleIds: ["super-admin"],
      isActive: true,
    }) as Record<string, unknown>;

    expect(parsed.id).toBeUndefined();
    expect(parsed.roleIds).toBeUndefined();
    expect(parsed.isActive).toBeUndefined();
    expect(Object.keys(parsed).sort()).toEqual(["name"]);
  });

  it("requires a usable name", () => {
    expect(profileUpdateSchema.safeParse({ name: "a" }).success).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  const valid = {
    currentPassword: "old-password",
    newPassword: "brand-new-password",
    confirmPassword: "brand-new-password",
  };

  it("accepts a well-formed change", () => {
    expect(passwordChangeSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(passwordChangeSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false);
  });

  it("rejects a mismatched confirmation", () => {
    const result = passwordChangeSchema.safeParse({ ...valid, confirmPassword: "other" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("rejects reusing the current password", () => {
    const same = "same-password-here";
    const result = passwordChangeSchema.safeParse({
      currentPassword: same,
      newPassword: same,
      confirmPassword: same,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["newPassword"]);
  });

  it("enforces a minimum length on the new password", () => {
    expect(
      passwordChangeSchema.safeParse({ ...valid, newPassword: "short", confirmPassword: "short" })
        .success,
    ).toBe(false);
  });
});
