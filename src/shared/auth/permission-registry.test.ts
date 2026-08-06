import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  PERMISSION_NAMES,
  PERMISSION_RESOURCES,
  isKnownPermission,
} from "@/shared/auth/permission-registry";

describe("permission registry", () => {
  it("derives one permission per resource action", () => {
    const expected = PERMISSION_RESOURCES.reduce((sum, r) => sum + r.actions.length, 0);
    expect(PERMISSIONS).toHaveLength(expected);
  });

  it("has no duplicate names", () => {
    expect(new Set(PERMISSION_NAMES).size).toBe(PERMISSION_NAMES.length);
  });

  it("names every permission `resource.action`", () => {
    for (const permission of PERMISSIONS) {
      expect(permission.name).toBe(`${permission.resource}.${permission.action}`);
    }
  });

  it("recognises registered names and rejects invented ones", () => {
    expect(isKnownPermission("services.update")).toBe(true);
    expect(isKnownPermission("services.launch-rockets")).toBe(false);
  });
});
