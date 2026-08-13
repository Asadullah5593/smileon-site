import { describe, expect, it } from "vitest";
import { assertCanSetStatus, canSetStatus, changesVisibility } from "@/shared/auth/publish-guard";
import { ForbiddenError } from "@/shared/api/errors";

const author = { permissions: ["posts.read", "posts.create", "posts.update"], isSuperAdmin: false };
const editor = { permissions: [...author.permissions, "posts.publish"], isSuperAdmin: false };
const superAdmin = { permissions: [], isSuperAdmin: true };

describe("changesVisibility", () => {
  it("is false when no status change was requested", () => {
    expect(changesVisibility(undefined, "PUBLISHED")).toBe(false);
  });

  it("is true when a record goes live", () => {
    expect(changesVisibility("PUBLISHED", "DRAFT")).toBe(true);
    expect(changesVisibility("PUBLISHED", undefined)).toBe(true);
  });

  it("is true when a live record is taken down", () => {
    expect(changesVisibility("DRAFT", "PUBLISHED")).toBe(true);
    expect(changesVisibility("ARCHIVED", "PUBLISHED")).toBe(true);
  });

  it("is false for moves between two non-public states", () => {
    expect(changesVisibility("ARCHIVED", "DRAFT")).toBe(false);
    expect(changesVisibility("DRAFT", "ARCHIVED")).toBe(false);
    expect(changesVisibility("DRAFT", undefined)).toBe(false);
  });

  it("is false when the status is unchanged", () => {
    expect(changesVisibility("PUBLISHED", "PUBLISHED")).toBe(false);
  });
});

describe("canSetStatus", () => {
  // The hole this guard exists to close: `posts.update` alone must not publish.
  it("stops an author publishing a draft", () => {
    expect(canSetStatus(author, "posts", "PUBLISHED", "DRAFT")).toBe(false);
  });

  it("stops an author unpublishing live content", () => {
    expect(canSetStatus(author, "posts", "DRAFT", "PUBLISHED")).toBe(false);
    expect(canSetStatus(author, "posts", "ARCHIVED", "PUBLISHED")).toBe(false);
  });

  it("stops an author creating something already live", () => {
    expect(canSetStatus(author, "posts", "PUBLISHED")).toBe(false);
  });

  it("lets an author edit an already-published record", () => {
    // The form resubmits the unchanged status; visibility did not change.
    expect(canSetStatus(author, "posts", "PUBLISHED", "PUBLISHED")).toBe(true);
  });

  it("lets an author work freely between draft and archived", () => {
    expect(canSetStatus(author, "posts", "DRAFT", "ARCHIVED")).toBe(true);
    expect(canSetStatus(author, "posts", "ARCHIVED", "DRAFT")).toBe(true);
    expect(canSetStatus(author, "posts", "DRAFT")).toBe(true);
  });

  it("lets an editor publish and unpublish", () => {
    expect(canSetStatus(editor, "posts", "PUBLISHED", "DRAFT")).toBe(true);
    expect(canSetStatus(editor, "posts", "DRAFT", "PUBLISHED")).toBe(true);
  });

  it("scopes the permission per resource", () => {
    // Holding posts.publish must not allow publishing a service.
    expect(canSetStatus(editor, "services", "PUBLISHED", "DRAFT")).toBe(false);
  });

  it("short-circuits for a super admin", () => {
    expect(canSetStatus(superAdmin, "posts", "PUBLISHED", "DRAFT")).toBe(true);
  });

  it("denies a signed-out viewer", () => {
    expect(canSetStatus(null, "posts", "PUBLISHED", "DRAFT")).toBe(false);
  });
});

describe("assertCanSetStatus", () => {
  it("returns quietly when allowed", () => {
    expect(() => assertCanSetStatus(editor, "posts", "PUBLISHED", "DRAFT")).not.toThrow();
  });

  it("throws ForbiddenError naming the missing permission", () => {
    try {
      assertCanSetStatus(author, "posts", "PUBLISHED", "DRAFT");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect((error as ForbiddenError).status).toBe(403);
      expect((error as ForbiddenError).requiredPermissions).toEqual(["posts.publish"]);
    }
  });

  it("distinguishes publishing from taking content down", () => {
    expect(() => assertCanSetStatus(author, "posts", "PUBLISHED", "DRAFT")).toThrow(/publish/i);
    expect(() => assertCanSetStatus(author, "posts", "DRAFT", "PUBLISHED")).toThrow(
      /off the website/i,
    );
  });
});
