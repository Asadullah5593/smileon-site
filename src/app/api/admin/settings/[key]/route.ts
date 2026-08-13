import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { ok } from "@/shared/api/response";
import { settingKeySchema } from "@/features/settings/schemas";
import { updateSetting } from "@/features/settings/server/settings-repository";

const paramsSchema = z.object({ key: settingKeySchema });

// The body shape depends on `key`, so it is validated in the repository
// against that key's schema rather than by a single body schema here.
export const PUT = createRouteHandler(
  { permission: "settings.manage", params: paramsSchema, body: z.unknown() },
  async ({ params, body, viewer }) => ok(await updateSetting(params.key, body, viewer)),
);
