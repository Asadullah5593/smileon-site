import { createRouteHandler } from "@/shared/api/route-handler";
import { created } from "@/shared/api/response";
import { menuItemCreateSchema } from "@/features/menus/schemas";
import { createMenuItem } from "@/features/menus/server/menu-repository";

// Menu items are edited by anyone who may change a menu.
export const POST = createRouteHandler(
  { permission: "menus.update", body: menuItemCreateSchema },
  async ({ body, viewer }) => created(await createMenuItem(body, viewer)),
);
