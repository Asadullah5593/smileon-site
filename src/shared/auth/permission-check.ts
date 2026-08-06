import type { PermissionName } from "@/shared/auth/permission-registry";

type PermissionHolder = { isSuperAdmin: boolean; permissions: string[] };

/**
 * The permission predicate, isolated from any server-only import so both the
 * server resolver (`shared/auth/permissions.ts`) and the client hook
 * (`usePermissions`) evaluate access with exactly the same rules.
 */
export function viewerCan(
  viewer: PermissionHolder | null,
  ...permissions: PermissionName[]
): boolean {
  if (!viewer) return false;
  if (viewer.isSuperAdmin) return true;
  return permissions.every((p) => viewer.permissions.includes(p));
}

export function viewerCanAny(
  viewer: PermissionHolder | null,
  ...permissions: PermissionName[]
): boolean {
  if (!viewer) return false;
  if (viewer.isSuperAdmin) return true;
  return permissions.some((p) => viewer.permissions.includes(p));
}
