import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { faqUpdateSchema } from "@/features/faqs/schemas";
import { deleteFaq, getFaqById, updateFaq } from "@/features/faqs/server/faq-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "faqs.read", params: paramsSchema },
  async ({ params }) => ok(await getFaqById(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "faqs.update", params: paramsSchema, body: faqUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateFaq(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "faqs.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteFaq(params.id, viewer);
    return noContent();
  },
);
