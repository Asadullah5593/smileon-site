import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { redirectCreateSchema, redirectListQuerySchema } from "@/features/redirects/schemas";
import { createRedirect, listRedirects } from "@/features/redirects/server/redirect-repository";

export const GET = createRouteHandler(
  { permission: "redirects.read", query: redirectListQuerySchema },
  async ({ query }) => ok(await listRedirects(query)),
);

export const POST = createRouteHandler(
  { permission: "redirects.create", body: redirectCreateSchema },
  async ({ body, viewer }) => created(await createRedirect(body, viewer)),
);
