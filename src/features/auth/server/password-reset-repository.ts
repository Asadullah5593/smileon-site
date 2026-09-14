import "server-only";
import { prisma } from "@/shared/db/prisma";
import { ValidationError } from "@/shared/api/errors";
import { createOneTimeToken, hashPassword, hashToken } from "@/shared/auth/password";
import { sendMail } from "@/shared/email";
import { recordAudit } from "@/shared/audit/audit-log";
import { siteUrl } from "@/shared/config/env";
import {
  RESET_TTL_HOURS,
  type PasswordResetInput,
  type PasswordResetRequestInput,
} from "@/features/auth/schemas";

/**
 * Forgotten-password flow.
 *
 * Tokens are single-use, expire in an hour, and are stored hashed. The request
 * endpoint always reports success — telling an anonymous caller whether an
 * address has an account is an account-enumeration oracle.
 */

export async function requestPasswordReset(input: PasswordResetRequestInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, isActive: true },
  });

  // Deactivated accounts get no link either, and still no distinguishable
  // response.
  if (!user || !user.isActive) return;

  const { token, tokenHash } = createOneTimeToken();

  // Only the newest link should work.
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000),
    },
  });

  const link = `${siteUrl}/reset-password/${token}`;
  await sendMail({
    to: input.email,
    subject: "Reset your SmileOn CMS password",
    html: `
      <h2>Hello ${escapeHtml(user.name)},</h2>
      <p>Someone asked to reset the password for this account.</p>
      <p><a href="${link}">Choose a new password</a></p>
      <p>This link expires in ${RESET_TTL_HOURS} hour and can be used once. If you didn't ask for it, you can ignore this email.</p>
    `,
  });
}

/** Whether a token is still usable, for the reset screen. */
export async function isResetTokenValid(token: string) {
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { usedAt: true, expiresAt: true },
  });
  return Boolean(row && !row.usedAt && row.expiresAt > new Date());
}

export async function resetPassword(input: PasswordResetInput) {
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(input.token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new ValidationError(
      { token: "invalid" },
      "That reset link is invalid or has expired. Request a new one.",
    );
  }

  const passwordHash = await hashPassword(input.password);

  // Marking the token used and setting the password must happen together, or a
  // failure could leave a spent token with the old password still in place.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordHash,
        // Force live sessions to re-resolve.
        permissionsVersion: { increment: 1 },
      },
    }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    // Any other outstanding links for this user are void too.
    prisma.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  await recordAudit({
    actorId: row.userId,
    action: "profile.password",
    entity: "User",
    entityId: row.userId,
    summary: "Reset their password via email",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
