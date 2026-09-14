import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toSkipTake } from "@/shared/api/list-query";
import { NotFoundError } from "@/shared/api/errors";
import { clinicInbox, sendMail } from "@/shared/email";
import { recordAudit } from "@/shared/audit/audit-log";
import type {
  AppointmentDto,
  AppointmentListQuery,
  AppointmentRequestInput,
  AppointmentUpdateInput,
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

const withRelations = {
  service: { select: { title: true } },
  location: { select: { name: true } },
} satisfies Prisma.AppointmentInclude;

type AppointmentRow = Prisma.AppointmentGetPayload<{ include: typeof withRelations }>;

function toAppointmentDto(a: AppointmentRow): AppointmentDto {
  return {
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
  };
}

/**
 * Shared by the list and the CSV export so an export always contains exactly
 * the rows the operator is looking at.
 */
function toWhere(query: AppointmentListQuery): Prisma.AppointmentWhereInput {
  return {
    ...(query.appointmentStatus ? { status: query.appointmentStatus } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
            // `to` is inclusive, so take the end of that day.
            ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
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
}

export async function listAppointments(query: AppointmentListQuery) {
  const where = toWhere(query);

  const [rows, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: withRelations,
      orderBy: { createdAt: "desc" },
      ...toSkipTake(query),
    }),
    prisma.appointment.count({ where }),
  ]);

  return paginate(rows.map(toAppointmentDto), total, query.page, query.pageSize);
}

/** Every matching row, ignoring pagination — for the CSV export. */
export async function listAppointmentsForExport(query: AppointmentListQuery) {
  const rows = await prisma.appointment.findMany({
    where: toWhere(query),
    include: withRelations,
    orderBy: { createdAt: "desc" },
    // A hard ceiling so one export cannot pull the whole table into memory.
    take: 5000,
  });
  return rows.map(toAppointmentDto);
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

export async function deleteAppointment(id: string, actorId: string) {
  const appointment = await prisma.appointment.delete({ where: { id } }).catch(() => null);
  if (!appointment) throw new NotFoundError("Appointment");

  await recordAudit({
    actorId,
    action: "appointments.delete",
    entity: "Appointment",
    entityId: id,
    summary: `${appointment.name} · ${appointment.phone}`,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
