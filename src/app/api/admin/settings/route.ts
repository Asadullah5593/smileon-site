import { createRouteHandler } from "@/shared/api/route-handler";
import { ok } from "@/shared/api/response";
import { getAllSettings } from "@/features/settings/server/settings-repository";

export const GET = createRouteHandler({ permission: "settings.read" }, async () =>
  ok(await getAllSettings()),
);
