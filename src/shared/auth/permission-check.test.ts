import { describe, expect, it } from "vitest";
import { viewerCan, viewerCanAny } from "@/shared/auth/permission-check";

const viewer = (permissions: string[], isSuperAdmin = false) => ({ permissions, isSuperAdmin });

describe("viewerCan", () => {
  it("denies a signed-out visitor", () => {
    expect(viewerCan(null, "services.read")).toBe(false);
  });

  it("grants a permission the viewer holds", () => {
    expect(viewerCan(viewer(["services.read"]), "services.read")).toBe(true);
  });

  it("denies a permission the viewer lacks", () => {
    expect(viewerCan(viewer(["services.read"]), "services.update")).toBe(false);
  });

  it("requires every listed permission", () => {
    const editor = viewer(["services.read", "services.update"]);
    expect(viewerCan(editor, "services.read", "services.update")).toBe(true);
    expect(viewerCan(editor, "services.read", "services.delete")).toBe(false);
  });

  it("short-circuits for a super admin", () => {
    expect(viewerCan(viewer([], true), "roles.delete", "anything.at.all")).toBe(true);
  });
});

describe("viewerCanAny", () => {
  it("passes when at least one permission matches", () => {
    expect(viewerCanAny(viewer(["posts.read"]), "services.read", "posts.read")).toBe(true);
  });

  it("fails when none match", () => {
    expect(viewerCanAny(viewer(["posts.read"]), "services.read", "media.read")).toBe(false);
  });

  it("is false with an empty permission list", () => {
    expect(viewerCanAny(viewer(["posts.read"]))).toBe(false);
  });
});
