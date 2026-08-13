import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { inviteCreateSchema } from "@/features/auth/schemas";
import { inviteUser, listInvitations } from "@/features/auth/server/invitation-repository";

export const GET = createRouteHandler({ permission: "users.read" }, async () =>
  ok(await listInvitations()),
);

export const POST = createRouteHandler(
  { permission: "users.create", body: inviteCreateSchema },
  async ({ body, viewer }) => created(await inviteUser(body, viewer)),
);
