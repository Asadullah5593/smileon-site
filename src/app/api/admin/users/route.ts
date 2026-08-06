import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { userCreateSchema, userListQuerySchema } from "@/features/access/schemas";
import { createUser, listUsers } from "@/features/access/server/user-repository";

export const GET = createRouteHandler(
  { permission: "users.read", query: userListQuerySchema },
  async ({ query }) => ok(await listUsers(query)),
);

export const POST = createRouteHandler(
  { permission: "users.create", body: userCreateSchema },
  async ({ body, viewer }) => created(await createUser(body, viewer.id)),
);
