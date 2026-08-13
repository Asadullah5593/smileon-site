import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent } from "@/shared/api/response";
import { menuReorderSchema } from "@/features/menus/schemas";
import { reorderMenuItems } from "@/features/menus/server/menu-repository";

export const POST = createRouteHandler(
  { permission: "menus.update", body: menuReorderSchema },
  async ({ body, viewer }) => {
    await reorderMenuItems(body, viewer);
    return noContent();
  },
);
