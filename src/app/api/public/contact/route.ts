import { createRouteHandler } from "@/shared/api/route-handler";
import { created } from "@/shared/api/response";
import { clientKey, rateLimit } from "@/shared/api/rate-limit";
import { contactMessageSchema } from "@/features/messages/schemas";
import { createContactMessage } from "@/features/messages/server/message-repository";

export const POST = createRouteHandler({ body: contactMessageSchema }, async ({ req, body }) => {
  rateLimit(clientKey(req, "contact"), 5, 60_000);
  if (body.website) return created({ id: null });
  return created(await createContactMessage(body));
});
