import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { NotFoundError } from "@/shared/api/errors";
import { clinicInbox, sendMail } from "@/shared/email";
import { recordAudit } from "@/shared/audit/audit-log";
import type {
  ContactMessageInput,
  MessageDto,
  MessageListQuery,
} from "@/features/messages/schemas";
import type { ContactMessage, Prisma } from "@/generated/prisma/client";

/**
 * All `ContactMessage` data access. Nothing outside this file touches
 * `prisma.contactMessage`.
 */

const empty = (value: string | undefined) => (value && value.length > 0 ? value : null);

function toMessageDto(message: ContactMessage): MessageDto {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    isRead: message.isRead,
    createdAt: message.createdAt.toISOString(),
  };
}

/** Public submission from the website's contact form. */
export async function createContactMessage(input: ContactMessageInput) {
  const message = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      phone: empty(input.phone),
      subject: empty(input.subject),
      message: input.message,
    },
  });

  const inbox = clinicInbox();
  if (inbox) {
    await sendMail({
      to: inbox,
      replyTo: message.email,
      subject: `Website enquiry — ${message.subject ?? message.name}`,
      html: `
        <h2>New website enquiry</h2>
        <p><strong>From:</strong> ${escapeHtml(message.name)} (${escapeHtml(message.email)})</p>
        ${message.phone ? `<p><strong>Phone:</strong> ${escapeHtml(message.phone)}</p>` : ""}
        <p>${escapeHtml(message.message)}</p>
      `,
    });
  }

  return { id: message.id };
}

const SORTABLE = ["createdAt", "name"] as const;

export async function listMessages(query: MessageListQuery) {
  const where: Prisma.ContactMessageWhereInput = {
    ...(query.read ? { isRead: query.read === "true" } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { email: { contains: query.q } },
            { subject: { contains: query.q } },
            { message: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      // Unread first by default — this is an inbox, not an archive. Matches
      // the @@index([isRead, createdAt]) on the model.
      orderBy: query.sort
        ? toOrderBy(query, SORTABLE, { createdAt: "desc" })
        : [{ isRead: "asc" }, { createdAt: "desc" }],
      ...toSkipTake(query),
    }),
    prisma.contactMessage.count({ where }),
  ]);

  return paginate(rows.map(toMessageDto), total, query.page, query.pageSize);
}

export async function getMessage(id: string): Promise<MessageDto> {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) throw new NotFoundError("Message");
  return toMessageDto(message);
}

export async function countUnreadMessages() {
  return prisma.contactMessage.count({ where: { isRead: false } });
}

/**
 * Marking read is deliberately not audited: it fires whenever someone opens a
 * message, and burying real changes under that noise makes the audit log
 * useless. Deletion is audited.
 */
export async function setMessageRead(id: string, isRead: boolean): Promise<MessageDto> {
  const message = await prisma.contactMessage
    .update({ where: { id }, data: { isRead } })
    .catch(() => null);
  if (!message) throw new NotFoundError("Message");
  return toMessageDto(message);
}

export async function deleteMessage(id: string, actorId: string) {
  const message = await prisma.contactMessage.delete({ where: { id } }).catch(() => null);
  if (!message) throw new NotFoundError("Message");

  await recordAudit({
    actorId,
    action: "messages.delete",
    entity: "ContactMessage",
    entityId: id,
    summary: `${message.name} <${message.email}>`,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
