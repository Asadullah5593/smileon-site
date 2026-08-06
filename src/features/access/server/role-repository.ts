import "server-only";
import { prisma } from "@/shared/db/prisma";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/shared/api/errors";
import { uniqueSlug } from "@/shared/utils/slug";
import { recordAudit } from "@/shared/audit/audit-log";
import { bumpPermissionsVersion } from "@/shared/auth/permissions";
import { isKnownPermission } from "@/shared/auth/permission-registry";
import type { RoleCreateInput, RoleDto, RoleUpdateInput } from "@/features/access/schemas";

const roleInclude = {
  permissions: { select: { permission: { select: { name: true } } } },
  _count: { select: { users: true } },
};

type RoleRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isSuperAdmin: boolean;
  permissions: { permission: { name: string } }[];
  _count: { users: number };
};

function toRoleDto(role: RoleRow): RoleDto {
  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystem: role.isSystem,
    isSuperAdmin: role.isSuperAdmin,
    permissions: role.permissions.map((p) => p.permission.name).sort(),
    userCount: role._count.users,
  };
}

export async function listRoles(): Promise<RoleDto[]> {
  const roles = await prisma.role.findMany({
    include: roleInclude,
    orderBy: [{ isSuperAdmin: "desc" }, { isSystem: "desc" }, { name: "asc" }],
  });
  return roles.map(toRoleDto);
}

export async function getRole(id: string): Promise<RoleDto> {
  const role = await prisma.role.findUnique({ where: { id }, include: roleInclude });
  if (!role) throw new NotFoundError("Role");
  return toRoleDto(role);
}

export async function createRole(input: RoleCreateInput, actorId: string): Promise<RoleDto> {
  const permissionIds = await resolvePermissionIds(input.permissions);
  const slug = await uniqueSlug(input.name, async (candidate) =>
    Boolean(await prisma.role.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );

  const role = await prisma.role.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      permissions: { create: permissionIds.map((permissionId) => ({ permissionId })) },
    },
    include: roleInclude,
  });

  await recordAudit({
    actorId,
    action: "roles.create",
    entity: "Role",
    entityId: role.id,
    summary: role.name,
    diff: { permissions: input.permissions },
  });

  return toRoleDto(role);
}

export async function updateRole(
  id: string,
  input: RoleUpdateInput,
  actorId: string,
): Promise<RoleDto> {
  const existing = await prisma.role.findUnique({ where: { id }, include: roleInclude });
  if (!existing) throw new NotFoundError("Role");

  // The super-admin role is what guarantees someone can always get back in.
  if (existing.isSuperAdmin && input.permissions) {
    throw new ForbiddenError("The super admin role always has every permission.");
  }

  const permissionIds = input.permissions ? await resolvePermissionIds(input.permissions) : null;

  const role = await prisma.$transaction(async (tx) => {
    if (permissionIds) {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      });
    }
    return tx.role.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description ?? undefined,
      },
      include: roleInclude,
    });
  });

  // Anyone holding this role needs their session re-resolved.
  const holders = await prisma.userRole.findMany({ where: { roleId: id }, select: { userId: true } });
  await bumpPermissionsVersion(holders.map((h) => h.userId));

  await recordAudit({
    actorId,
    action: "roles.update",
    entity: "Role",
    entityId: id,
    summary: role.name,
    diff: {
      permissions: {
        from: existing.permissions.map((p) => p.permission.name),
        to: role.permissions.map((p) => p.permission.name),
      },
    },
  });

  return toRoleDto(role);
}

export async function deleteRole(id: string, actorId: string) {
  const role = await prisma.role.findUnique({ where: { id }, include: roleInclude });
  if (!role) throw new NotFoundError("Role");
  if (role.isSystem) throw new ForbiddenError("System roles cannot be deleted. Clone it instead.");
  if (role._count.users > 0) {
    throw new ConflictError(
      `${role._count.users} user(s) still have this role. Reassign them first.`,
    );
  }

  await prisma.role.delete({ where: { id } });
  await recordAudit({
    actorId,
    action: "roles.delete",
    entity: "Role",
    entityId: id,
    summary: role.name,
  });
}

/** Map permission names to ids, rejecting anything not in the code registry. */
async function resolvePermissionIds(names: string[]) {
  const unknown = names.filter((n) => !isKnownPermission(n));
  if (unknown.length > 0) {
    throw new ValidationError({ unknownPermissions: unknown }, "Unknown permissions requested.");
  }

  const rows = await prisma.permission.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  });

  const missing = names.filter((n) => !rows.some((r) => r.name === n));
  if (missing.length > 0) {
    throw new ValidationError(
      { missingPermissions: missing },
      "Some permissions are missing from the database. Run `npm run rbac:sync`.",
    );
  }

  return rows.map((r) => r.id);
}
