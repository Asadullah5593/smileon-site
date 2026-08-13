import { createRouteHandler } from "@/shared/api/route-handler";
import { ok } from "@/shared/api/response";
import { listMediaFolders } from "@/features/media/server/media-service";

export const GET = createRouteHandler({ permission: "media.read" }, async () =>
  ok(await listMediaFolders()),
);
