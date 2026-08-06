"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { viewerCan, viewerCanAny } from "@/shared/auth/permission-check";
import type { PermissionName } from "@/shared/auth/permission-registry";

export type ClientViewer = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isSuperAdmin: boolean;
  roles: { id: string; name: string; slug: string }[];
  permissions: string[];
};

const PermissionsContext = createContext<ClientViewer | null>(null);

/**
 * Seeded once from the server layout with the viewer resolved by
 * `getViewer()`, so client components can hide controls without another
 * round-trip. This is cosmetic only — the server guard is the real check.
 */
export function PermissionsProvider({
  viewer,
  children,
}: {
  viewer: ClientViewer;
  children: ReactNode;
}) {
  return <PermissionsContext.Provider value={viewer}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const viewer = useContext(PermissionsContext);
  if (!viewer) {
    throw new Error("usePermissions must be used inside a <PermissionsProvider>");
  }

  return useMemo(
    () => ({
      viewer,
      can: (...permissions: PermissionName[]) => viewerCan(viewer, ...permissions),
      canAny: (...permissions: PermissionName[]) => viewerCanAny(viewer, ...permissions),
    }),
    [viewer],
  );
}

/**
 * Renders `children` only when the viewer holds the permission(s).
 *
 *   <Can permission="services.create"><NewServiceButton /></Can>
 *   <Can anyOf={["posts.update", "posts.publish"]}>…</Can>
 */
export function Can({
  permission,
  anyOf,
  fallback = null,
  children,
}: {
  permission?: PermissionName | PermissionName[];
  anyOf?: PermissionName[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can, canAny } = usePermissions();

  const allowed = anyOf
    ? canAny(...anyOf)
    : permission
      ? can(...(Array.isArray(permission) ? permission : [permission]))
      : true;

  return <>{allowed ? children : fallback}</>;
}
