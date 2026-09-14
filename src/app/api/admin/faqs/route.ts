import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { faqCreateSchema, faqListQuerySchema } from "@/features/faqs/schemas";
import { createFaq, listFaqs } from "@/features/faqs/server/faq-repository";

export const GET = createRouteHandler(
  { permission: "faqs.read", query: faqListQuerySchema },
  async ({ query }) => ok(await listFaqs(query)),
);

export const POST = createRouteHandler(
  { permission: "faqs.create", body: faqCreateSchema },
  async ({ body, viewer }) => created(await createFaq(body, viewer)),
);
