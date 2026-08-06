import "server-only";
import { prisma } from "@/shared/db/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "@/shared/api/errors";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { hashPassword } from "@/shared/auth/password";
import { bumpPermissionsVersion } from "@/shared/auth/permissions";
import { isKnownPermission } from "@/shared/auth/permission-registry";
import { recordAudit } from "@/shared/audit/audit-log";
import type {
  UserCreateInput,
  UserDto,
  UserListQuery,
  UserUpdateInput,
} from "@/features/access/schemas";
import type { Prisma } from "@/generated/prisma/client";

const userInclude = {
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
  permissions: { select: { effect: true, permission: { select: { name: true } } } },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export function toUserDto(user: UserRow): UserDto {
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
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    roles: user.roles.map((r) => ({ id: r.role.id, name: r.role.name, slug: r.role.slug })),
    overrides: user.permissions.map((p) => ({
      permission: p.permission.name,
      effect: p.effect,
    })),
    effectivePermissions: [...granted].sort(),
    isSuperAdmin,
  };
}

const SORTABLE = ["name", "email", "createdAt", "lastLoginAt"] as const;

export async function listUsers(query: UserListQuery) {
  const where: Prisma.UserWhereInput = {
    ...(query.q ? { OR: [{ name: { contains: query.q } }, { email: { contains: query.q } }] } : {}),
    ...(query.roleId ? { roles: { some: { roleId: query.roleId } } } : {}),
    ...(query.active ? { isActive: query.active === "true" } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: toOrderBy(query, SORTABLE, { createdAt: "desc" }),
      ...toSkipTake(query),
    }),
    prisma.user.count({ where }),
  ]);

  return paginate(rows.map(toUserDto), total, query.page, query.pageSize);
}

export async function getUser(id: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id }, include: userInclude });
  if (!user) throw new NotFoundError("User");
  return toUserDto(user);
}

export async function createUser(input: UserCreateInput, actorId: string): Promise<UserDto> {
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      roles: { create: input.roleIds.map((roleId) => ({ roleId, assignedById: actorId })) },
    },
    include: userInclude,
  });

  await recordAudit({
    actorId,
    action: "users.create",
    entity: "User",
    entityId: user.id,
    summary: user.email,
  });

  return toUserDto(user);
}

export async function updateUser(
  id: string,
  input: UserUpdateInput,
  actorId: string,
): Promise<UserDto> {
  const existing = await prisma.user.findUnique({ where: { id }, include: userInclude });
  if (!existing) throw new NotFoundError("User");

  if (input.overrides) {
    const unknown = input.overrides.filter((o) => !isKnownPermission(o.permission));
    if (unknown.length > 0) {
      throw new ValidationError(
        { unknownPermissions: unknown.map((o) => o.permission) },
        "Unknown permissions requested.",
      );
    }
  }

  // Guard against an admin locking everyone out of the CMS.
  const removingSuperAdmin =
    existing.roles.some((r) => r.role.isSuperAdmin) &&
    input.roleIds !== undefined &&
    !(await roleIdsIncludeSuperAdmin(input.roleIds));
  if ((removingSuperAdmin || input.isActive === false) && (await isLastSuperAdmin(id))) {
    throw new ForbiddenError("This is the last super admin — keep at least one active.");
  }

  const user = await prisma.$transaction(async (tx) => {
    if (input.roleIds) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({
        data: input.roleIds.map((roleId) => ({ userId: id, roleId, assignedById: actorId })),
      });
    }

    if (input.overrides) {
      await tx.userPermission.deleteMany({ where: { userId: id } });
      if (input.overrides.length > 0) {
        const permissions = await tx.permission.findMany({
          where: { name: { in: input.overrides.map((o) => o.permission) } },
          select: { id: true, name: true },
        });
        await tx.userPermission.createMany({
          data: input.overrides.flatMap((o) => {
            const permission = permissions.find((p) => p.name === o.permission);
            return permission
              ? [{ userId: id, permissionId: permission.id, effect: o.effect }]
              : [];
          }),
        });
      }
    }

    return tx.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        isActive: input.isActive,
        ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
        permissionsVersion: { increment: 1 },
      },
      include: userInclude,
    });
  });

  await recordAudit({
    actorId,
    action: "users.update",
    entity: "User",
    entityId: id,
    summary: user.email,
    diff: {
      roles: {
        from: existing.roles.map((r) => r.role.slug),
        to: user.roles.map((r) => r.role.slug),
      },
      overrides: { from: existing.permissions.length, to: user.permissions.length },
    },
  });

  return toUserDto(user);
}

export async function deleteUser(id: string, actorId: string) {
  if (id === actorId) throw new ForbiddenError("You cannot delete your own account.");
  if (await isLastSuperAdmin(id)) {
    throw new ForbiddenError("This is the last super admin — keep at least one active.");
  }

  const user = await prisma.user.delete({ where: { id } });
  await recordAudit({
    actorId,
    action: "users.delete",
    entity: "User",
    entityId: id,
    summary: user.email,
  });
}

export async function setUserActive(id: string, isActive: boolean, actorId: string) {
  const user = await updateUser(id, { isActive }, actorId);
  await bumpPermissionsVersion([id]);
  return user;
}

async function roleIdsIncludeSuperAdmin(roleIds: string[]) {
  if (roleIds.length === 0) return false;
  const count = await prisma.role.count({ where: { id: { in: roleIds }, isSuperAdmin: true } });
  return count > 0;
}

async function isLastSuperAdmin(userId: string) {
  const others = await prisma.user.count({
    where: {
      id: { not: userId },
      isActive: true,
      roles: { some: { role: { isSuperAdmin: true } } },
    },
  });
  const isSuper = await prisma.user.count({
    where: { id: userId, roles: { some: { role: { isSuperAdmin: true } } } },
  });
  return isSuper > 0 && others === 0;
}
