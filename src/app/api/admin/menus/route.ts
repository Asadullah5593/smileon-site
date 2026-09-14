import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { menuCreateSchema } from "@/features/menus/schemas";
import { createMenu, listMenus } from "@/features/menus/server/menu-repository";

export const GET = createRouteHandler({ permission: "menus.read" }, async () =>
  ok(await listMenus()),
);

export const POST = createRouteHandler(
  { permission: "menus.create", body: menuCreateSchema },
  async ({ body, viewer }) => created(await createMenu(body, viewer)),
);
