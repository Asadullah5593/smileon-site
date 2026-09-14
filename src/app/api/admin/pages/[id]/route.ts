import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { pageUpdateSchema } from "@/features/pages/schemas";
import { deletePage, getPageById, updatePage } from "@/features/pages/server/page-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "pages.read", params: paramsSchema },
  async ({ params }) => ok(await getPageById(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "pages.update", params: paramsSchema, body: pageUpdateSchema },
  async ({ params, body, viewer }) => ok(await updatePage(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "pages.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deletePage(params.id, viewer);
    return noContent();
  },
);
