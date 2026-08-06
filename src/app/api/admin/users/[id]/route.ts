import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { userUpdateSchema } from "@/features/access/schemas";
import { deleteUser, getUser, updateUser } from "@/features/access/server/user-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "users.read", params: paramsSchema },
  async ({ params }) => ok(await getUser(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "users.update", params: paramsSchema, body: userUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateUser(params.id, body, viewer.id)),
);

export const DELETE = createRouteHandler(
  { permission: "users.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteUser(params.id, viewer.id);
    return noContent();
  },
);
