import "server-only";
import { prisma } from "@/shared/db/prisma";
import { ConflictError, ValidationError } from "@/shared/api/errors";
import { createOneTimeToken, hashPassword, hashToken } from "@/shared/auth/password";
import { sendMail } from "@/shared/email";
import { recordAudit } from "@/shared/audit/audit-log";
import { siteUrl } from "@/shared/config/env";
import {
  INVITE_TTL_HOURS,
  type InvitationDto,
  type InviteAcceptInput,
  type InviteCreateInput,
} from "@/features/auth/schemas";
import type { Viewer } from "@/shared/auth/permissions";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Staff invitations.
 *
 * The token is generated once, emailed in the clear, and stored only as a
 * SHA-256 hash — a database leak cannot be replayed into an account. The
 * invitee chooses their own password, so no administrator ever knows it.
 */

const withInviter = { invitedBy: { select: { name: true } } } satisfies Prisma.InvitationInclude;

type InvitationRow = Prisma.InvitationGetPayload<{ include: typeof withInviter }>;

function toInvitationDto(invitation: InvitationRow): InvitationDto {
  return {
    id: invitation.id,
    email: invitation.email,
    invitedByName: invitation.invitedBy?.name ?? null,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString(),
  };
}

export async function listInvitations(): Promise<InvitationDto[]> {
  const rows = await prisma.invitation.findMany({
    where: { acceptedAt: null },
    include: withInviter,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toInvitationDto);
}

export async function inviteUser(input: InviteCreateInput, viewer: Viewer) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("Someone already has an account with that email.");

  const roles = await prisma.role.findMany({
    where: { id: { in: input.roleIds } },
    select: { id: true },
  });
  if (roles.length !== input.roleIds.length) {
    throw new ValidationError({ roleIds: "unknown" }, "One of those roles no longer exists.");
  }

  const { token, tokenHash } = createOneTimeToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  // Re-inviting replaces any outstanding invitation for that address, so only
  // the newest link works.
  await prisma.invitation.deleteMany({ where: { email: input.email, acceptedAt: null } });

  const invitation = await prisma.invitation.create({
    data: {
      email: input.email,
      tokenHash,
      roleIds: { names: input.name, ids: input.roleIds },
      invitedById: viewer.id,
      expiresAt,
    },
    include: withInviter,
  });

  const link = `${siteUrl}/invite/${token}`;
  await sendMail({
    to: input.email,
    subject: "You've been invited to the SmileOn CMS",
    html: `
      <h2>Hello ${escapeHtml(input.name)},</h2>
      <p>${escapeHtml(viewer.name)} has invited you to help manage the SmileOn website.</p>
      <p><a href="${link}">Set your password and sign in</a></p>
      <p>This link expires in ${INVITE_TTL_HOURS} hours.</p>
    `,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "users.create",
    entity: "Invitation",
    entityId: invitation.id,
    summary: `Invited ${input.email}`,
  });

  return toInvitationDto(invitation);
}

export async function revokeInvitation(id: string, viewer: Viewer) {
  const invitation = await prisma.invitation.delete({ where: { id } }).catch(() => null);
  if (!invitation) throw new ValidationError({ id: "unknown" }, "That invitation is already gone.");

  await recordAudit({
    actorId: viewer.id,
    action: "users.delete",
    entity: "Invitation",
    entityId: id,
    summary: `Revoked the invitation for ${invitation.email}`,
  });
}

/** Look up a token for the accept screen, without consuming it. */
export async function peekInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { email: true, expiresAt: true, acceptedAt: true, roleIds: true },
  });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) return null;

  const payload = invitation.roleIds as { names?: string } | null;
  return { email: invitation.email, name: payload?.names ?? "" };
}

/**
 * Claim an invitation: create the user with the invited roles and mark the
 * invitation used, in one transaction so a failure can't leave a half-made
 * account with a spent token.
 */
export async function acceptInvitation(input: InviteAcceptInput) {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(input.token) },
  });

  const invalid = new ValidationError(
    { token: "invalid" },
    "That invitation link is invalid or has expired. Ask for a new one.",
  );
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) throw invalid;

  const existing = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existing) throw new ConflictError("That account already exists — try signing in.");

  const payload = invitation.roleIds as { names?: string; ids?: string[] } | null;
  const roleIds = payload?.ids ?? [];
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: invitation.email,
        name: payload?.names || invitation.email,
        passwordHash,
        roles: {
          create: roleIds.map((roleId) => ({ roleId, assignedById: invitation.invitedById })),
        },
      },
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return created;
  });

  await recordAudit({
    actorId: user.id,
    action: "users.create",
    entity: "User",
    entityId: user.id,
    summary: `${user.email} accepted their invitation`,
  });

  return { email: user.email };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
