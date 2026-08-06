import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { roleCreateSchema } from "@/features/access/schemas";
import { createRole, listRoles } from "@/features/access/server/role-repository";

export const GET = createRouteHandler({ permission: "roles.read" }, async () =>
  ok(await listRoles()),
);

export const POST = createRouteHandler(
  { permission: "roles.create", body: roleCreateSchema },
  async ({ body, viewer }) => created(await createRole(body, viewer.id)),
);
