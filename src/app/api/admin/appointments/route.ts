import { createRouteHandler } from "@/shared/api/route-handler";
import { ok } from "@/shared/api/response";
import { appointmentListQuerySchema } from "@/features/appointments/schemas";
import { listAppointments } from "@/features/appointments/server/appointment-repository";

export const GET = createRouteHandler(
  { permission: "appointments.read", query: appointmentListQuerySchema },
  async ({ query }) => ok(await listAppointments(query)),
);
