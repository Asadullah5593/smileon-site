import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { menuItemUpdateSchema } from "@/features/menus/schemas";
import { deleteMenuItem, updateMenuItem } from "@/features/menus/server/menu-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const PATCH = createRouteHandler(
  { permission: "menus.update", params: paramsSchema, body: menuItemUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateMenuItem(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "menus.update", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteMenuItem(params.id, viewer);
    return noContent();
  },
);
