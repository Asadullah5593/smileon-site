import "server-only";
import { prisma } from "@/shared/db/prisma";
import { NotFoundError, ValidationError } from "@/shared/api/errors";
import { hashPassword, verifyPassword } from "@/shared/auth/password";
import { recordAudit } from "@/shared/audit/audit-log";
import type {
  PasswordChangeInput,
  ProfileDto,
  ProfileUpdateInput,
} from "@/features/profile/schemas";

/**
 * The signed-in user acting on their own account.
 *
 * Every function here takes `userId` from the resolved viewer, never from a
 * request parameter — this is the only part of the admin with no permission
 * gate, so the identity must not be caller-supplied.
 */

export async function getProfile(userId: string): Promise<ProfileDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      lastLoginAt: true,
      roles: { select: { role: { select: { id: true, name: true } } } },
    },
  });
  if (!user) throw new NotFoundError("Account");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    roles: user.roles.map((r) => ({ id: r.role.id, name: r.role.name })),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<ProfileDto> {
  await prisma.user.update({
    where: { id: userId },
    data: { name: input.name, image: input.image ?? null },
  });

  await recordAudit({
    actorId: userId,
    action: "profile.update",
    entity: "User",
    entityId: userId,
    summary: "Updated their own profile",
  });

  return getProfile(userId);
}

/**
 * Changing a password requires the current one, so a walked-up-to unlocked
 * screen cannot be used to lock the real owner out.
 */
export async function changeOwnPassword(userId: string, input: PasswordChangeInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new NotFoundError("Account");

  if (!user.passwordHash) {
    throw new ValidationError(
      { currentPassword: "unset" },
      "This account has no password set. Use the reset link on the sign-in page.",
    );
  }

  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new ValidationError(
      { currentPassword: "incorrect" },
      "That current password isn't right.",
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(input.newPassword),
      // Any outstanding reset links are void once the password changes.
      resetTokens: { updateMany: { where: { usedAt: null }, data: { usedAt: new Date() } } },
    },
  });

  await recordAudit({
    actorId: userId,
    action: "profile.password",
    entity: "User",
    entityId: userId,
    summary: "Changed their own password",
  });
}
