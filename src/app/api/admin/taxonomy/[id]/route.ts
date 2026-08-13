import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { taxonomyKindSchema, taxonomyUpdateSchema } from "@/features/taxonomy/schemas";
import {
  deleteTaxonomyTerm,
  updateTaxonomyTerm,
} from "@/features/taxonomy/server/taxonomy-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const PATCH = createRouteHandler(
  { permission: "taxonomy.update", params: paramsSchema, body: taxonomyUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateTaxonomyTerm(params.id, body, viewer)),
);

// `kind` selects the table, so DELETE needs it too — it rides in the query.
export const DELETE = createRouteHandler(
  {
    permission: "taxonomy.delete",
    params: paramsSchema,
    query: z.object({ kind: taxonomyKindSchema }),
  },
  async ({ params, query, viewer }) => {
    await deleteTaxonomyTerm(params.id, query.kind, viewer);
    return noContent();
  },
);
