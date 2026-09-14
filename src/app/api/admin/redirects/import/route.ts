import { createRouteHandler } from "@/shared/api/route-handler";
import { ok } from "@/shared/api/response";
import { redirectBulkSchema } from "@/features/redirects/schemas";
import { importRedirects } from "@/features/redirects/server/redirect-repository";

export const POST = createRouteHandler(
  { permission: "redirects.create", body: redirectBulkSchema },
  async ({ body, viewer }) => ok(await importRedirects(body.text, viewer)),
);
