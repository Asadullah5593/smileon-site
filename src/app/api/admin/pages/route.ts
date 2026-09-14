import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { pageCreateSchema, pageListQuerySchema } from "@/features/pages/schemas";
import { createPage, listPages } from "@/features/pages/server/page-repository";

export const GET = createRouteHandler(
  { permission: "pages.read", query: pageListQuerySchema },
  async ({ query }) => ok(await listPages(query)),
);

export const POST = createRouteHandler(
  { permission: "pages.create", body: pageCreateSchema },
  async ({ body, viewer }) => created(await createPage(body, viewer)),
);
