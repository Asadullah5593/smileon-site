import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { mediaUpdateSchema } from "@/features/media/schemas";
import { deleteMedia, updateMedia } from "@/features/media/server/media-service";

const paramsSchema = z.object({ id: z.string().min(1) });

export const PATCH = createRouteHandler(
  { permission: "media.update", params: paramsSchema, body: mediaUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateMedia(params.id, body, viewer.id)),
);

export const DELETE = createRouteHandler(
  { permission: "media.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteMedia(params.id, viewer.id);
    return noContent();
  },
);
