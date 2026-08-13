import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { messageUpdateSchema } from "@/features/messages/schemas";
import {
  deleteMessage,
  getMessage,
  setMessageRead,
} from "@/features/messages/server/message-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "messages.read", params: paramsSchema },
  async ({ params }) => ok(await getMessage(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "messages.update", params: paramsSchema, body: messageUpdateSchema },
  async ({ params, body }) => ok(await setMessageRead(params.id, body.isRead)),
);

export const DELETE = createRouteHandler(
  { permission: "messages.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteMessage(params.id, viewer.id);
    return noContent();
  },
);
