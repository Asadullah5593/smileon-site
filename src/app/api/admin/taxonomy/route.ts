import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { taxonomyCreateSchema, taxonomyListQuerySchema } from "@/features/taxonomy/schemas";
import { createTaxonomyTerm, listTaxonomy } from "@/features/taxonomy/server/taxonomy-repository";

export const GET = createRouteHandler(
  { permission: "taxonomy.read", query: taxonomyListQuerySchema },
  async ({ query }) => ok(await listTaxonomy(query)),
);

export const POST = createRouteHandler(
  { permission: "taxonomy.create", body: taxonomyCreateSchema },
  async ({ body, viewer }) => created(await createTaxonomyTerm(body, viewer)),
);
