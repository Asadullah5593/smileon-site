import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { teamCreateSchema, teamListQuerySchema } from "@/features/team/schemas";
import { createTeamMember, listTeamMembers } from "@/features/team/server/team-repository";

export const GET = createRouteHandler(
  { permission: "team.read", query: teamListQuerySchema },
  async ({ query }) => ok(await listTeamMembers(query)),
);

export const POST = createRouteHandler(
  { permission: "team.create", body: teamCreateSchema },
  async ({ body, viewer }) => created(await createTeamMember(body, viewer)),
);
