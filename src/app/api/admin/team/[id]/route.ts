import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { teamUpdateSchema } from "@/features/team/schemas";
import {
  deleteTeamMember,
  getTeamMemberById,
  updateTeamMember,
} from "@/features/team/server/team-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "team.read", params: paramsSchema },
  async ({ params }) => ok(await getTeamMemberById(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "team.update", params: paramsSchema, body: teamUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateTeamMember(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "team.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteTeamMember(params.id, viewer);
    return noContent();
  },
);
