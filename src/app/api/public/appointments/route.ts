import { createRouteHandler } from "@/shared/api/route-handler";
import { created } from "@/shared/api/response";
import { clientKey, rateLimit } from "@/shared/api/rate-limit";
import { appointmentRequestSchema } from "@/features/appointments/schemas";
import { createAppointmentRequest } from "@/features/appointments/server/appointment-repository";

// Public and unauthenticated — rate limited and honeypot-guarded instead.
export const POST = createRouteHandler(
  { body: appointmentRequestSchema },
  async ({ req, body }) => {
    rateLimit(clientKey(req, "appointments"), 5, 60_000);

    // A filled honeypot is a bot: accept silently so it doesn't retry.
    if (body.website) return created({ id: null });

    return created(await createAppointmentRequest(body));
  },
);
