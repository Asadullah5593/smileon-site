import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { roleUpdateSchema } from "@/features/access/schemas";
import { deleteRole, getRole, updateRole } from "@/features/access/server/role-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "roles.read", params: paramsSchema },
  async ({ params }) => ok(await getRole(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "roles.update", params: paramsSchema, body: roleUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateRole(params.id, body, viewer.id)),
);

export const DELETE = createRouteHandler(
  { permission: "roles.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteRole(params.id, viewer.id);
    return noContent();
  },
);
