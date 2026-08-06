import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toSkipTake } from "@/shared/api/list-query";
import { NotFoundError } from "@/shared/api/errors";
import { clinicInbox, sendMail } from "@/shared/email";
import { recordAudit } from "@/shared/audit/audit-log";
import type {
  AppointmentListQuery,
  AppointmentRequestInput,
  AppointmentUpdateInput,
  ContactMessageInput,
} from "@/features/appointments/schemas";
import type { Prisma } from "@/generated/prisma/client";

const empty = (value: string | undefined) => (value && value.length > 0 ? value : null);

export async function createAppointmentRequest(input: AppointmentRequestInput) {
  const appointment = await prisma.appointment.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: empty(input.email),
      serviceId: empty(input.serviceId),
      locationId: empty(input.locationId),
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
      preferredTime: empty(input.preferredTime),
      message: empty(input.message),
    },
    include: { service: { select: { title: true } } },
  });

  const inbox = clinicInbox();
  if (inbox) {
    await sendMail({
      to: inbox,
      replyTo: appointment.email ?? undefined,
      subject: `New appointment request — ${appointment.name}`,
      html: `
        <h2>New appointment request</h2>
        <p><strong>Name:</strong> ${escapeHtml(appointment.name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(appointment.phone)}</p>
        ${appointment.email ? `<p><strong>Email:</strong> ${escapeHtml(appointment.email)}</p>` : ""}
        ${appointment.service ? `<p><strong>Treatment:</strong> ${escapeHtml(appointment.service.title)}</p>` : ""}
        ${appointment.preferredDate ? `<p><strong>Preferred:</strong> ${appointment.preferredDate.toDateString()} ${escapeHtml(appointment.preferredTime ?? "")}</p>` : ""}
        ${appointment.message ? `<p>${escapeHtml(appointment.message)}</p>` : ""}
      `,
    });
  }

  return { id: appointment.id };
}

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

export async function listAppointments(query: AppointmentListQuery) {
  const where: Prisma.AppointmentWhereInput = {
    ...(query.appointmentStatus ? { status: query.appointmentStatus } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { phone: { contains: query.q } },
            { email: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { service: { select: { title: true } }, location: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      ...toSkipTake(query),
    }),
    prisma.appointment.count({ where }),
  ]);

  return paginate(
    rows.map((a) => ({
      id: a.id,
      name: a.name,
      phone: a.phone,
      email: a.email,
      serviceTitle: a.service?.title ?? null,
      locationName: a.location?.name ?? null,
      preferredDate: a.preferredDate?.toISOString() ?? null,
      preferredTime: a.preferredTime,
      message: a.message,
      status: a.status,
      internalNote: a.internalNote,
      createdAt: a.createdAt.toISOString(),
    })),
    total,
    query.page,
    query.pageSize,
  );
}

export async function updateAppointment(
  id: string,
  input: AppointmentUpdateInput,
  actorId: string,
) {
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Appointment");

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: input.status, internalNote: input.internalNote ?? undefined },
  });

  await recordAudit({
    actorId,
    action: "appointments.update",
    entity: "Appointment",
    entityId: id,
    summary: `${appointment.name} → ${appointment.status}`,
  });

  return appointment;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
