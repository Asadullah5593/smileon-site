import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { redirectUpdateSchema } from "@/features/redirects/schemas";
import { deleteRedirect, updateRedirect } from "@/features/redirects/server/redirect-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const PATCH = createRouteHandler(
  { permission: "redirects.update", params: paramsSchema, body: redirectUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateRedirect(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "redirects.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteRedirect(params.id, viewer);
    return noContent();
  },
);
