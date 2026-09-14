import "server-only";
import { cache } from "react";
import { prisma } from "@/shared/db/prisma";
import { auth } from "@/shared/auth/auth";
import { ForbiddenError, UnauthorizedError } from "@/shared/api/errors";
import { viewerCan, viewerCanAny } from "@/shared/auth/permission-check";
import type { PermissionName } from "@/shared/auth/permission-registry";

export { viewerCan, viewerCanAny };

export type Viewer = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isSuperAdmin: boolean;
  roles: { id: string; name: string; slug: string }[];
  /** Effective, fully-resolved permission names. Empty for a super admin. */
  permissions: string[];
};

/**
 * Resolve the signed-in user together with their effective permissions.
 *
 * Effective set = union of every role's permissions
 *               + per-user ALLOW overrides
 *               - per-user DENY overrides (DENY always wins).
 *
 * Cached per request via React `cache()`, so a page that renders ten
 * permission-gated components still issues one query.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isActive: true,
      roles: {
        select: {
          role: {
            select: {
              id: true,
              name: true,
              slug: true,
              isSuperAdmin: true,
              permissions: { select: { permission: { select: { name: true } } } },
            },
          },
        },
      },
      permissions: {
        select: { effect: true, permission: { select: { name: true } } },
      },
    },
  });

  if (!user || !user.isActive) return null;

  const isSuperAdmin = user.roles.some((r) => r.role.isSuperAdmin);

  const granted = new Set<string>();
  for (const { role } of user.roles) {
    for (const rp of role.permissions) granted.add(rp.permission.name);
  }
  for (const up of user.permissions) {
    if (up.effect === "ALLOW") granted.add(up.permission.name);
  }
  for (const up of user.permissions) {
    if (up.effect === "DENY") granted.delete(up.permission.name);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    isSuperAdmin,
    roles: user.roles.map((r) => ({ id: r.role.id, name: r.role.name, slug: r.role.slug })),
    permissions: [...granted].sort(),
  };
});

export async function can(...permissions: PermissionName[]) {
  return viewerCan(await getViewer(), ...permissions);
}

/** Throws `UnauthorizedError` when signed out. */
export async function requireUser(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new UnauthorizedError();
  return viewer;
}

/** Requires *all* of the listed permissions. */
export async function requirePermission(...permissions: PermissionName[]): Promise<Viewer> {
  const viewer = await requireUser();
  if (!viewerCan(viewer, ...permissions)) throw new ForbiddenError(undefined, permissions);
  return viewer;
}

/** Requires *at least one* of the listed permissions. */
export async function requireAnyPermission(...permissions: PermissionName[]): Promise<Viewer> {
  const viewer = await requireUser();
  if (!viewerCanAny(viewer, ...permissions)) throw new ForbiddenError(undefined, permissions);
  return viewer;
}

/**
 * Invalidate live sessions for the given users after their access changed.
 * The bumped counter is compared against the JWT on the next request.
 */
export async function bumpPermissionsVersion(userIds: string[]) {
  if (userIds.length === 0) return;
  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { permissionsVersion: { increment: 1 } },
  });
}
