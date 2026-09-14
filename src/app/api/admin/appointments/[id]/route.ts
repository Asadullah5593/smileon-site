import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { appointmentUpdateSchema } from "@/features/appointments/schemas";
import {
  deleteAppointment,
  updateAppointment,
} from "@/features/appointments/server/appointment-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const PATCH = createRouteHandler(
  { permission: "appointments.update", params: paramsSchema, body: appointmentUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateAppointment(params.id, body, viewer.id)),
);

export const DELETE = createRouteHandler(
  { permission: "appointments.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteAppointment(params.id, viewer.id);
    return noContent();
  },
);
