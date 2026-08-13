import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent } from "@/shared/api/response";
import { revokeInvitation } from "@/features/auth/server/invitation-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const DELETE = createRouteHandler(
  { permission: "users.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await revokeInvitation(params.id, viewer);
    return noContent();
  },
);
