import { createRouteHandler } from "@/shared/api/route-handler";
import { ok } from "@/shared/api/response";
import { messageListQuerySchema } from "@/features/messages/schemas";
import { listMessages } from "@/features/messages/server/message-repository";

export const GET = createRouteHandler(
  { permission: "messages.read", query: messageListQuerySchema },
  async ({ query }) => ok(await listMessages(query)),
);
