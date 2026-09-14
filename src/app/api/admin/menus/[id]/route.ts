import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { menuUpdateSchema } from "@/features/menus/schemas";
import { deleteMenu, updateMenu } from "@/features/menus/server/menu-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const PATCH = createRouteHandler(
  { permission: "menus.update", params: paramsSchema, body: menuUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateMenu(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "menus.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteMenu(params.id, viewer);
    return noContent();
  },
);
