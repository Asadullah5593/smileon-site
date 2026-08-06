import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { serviceCreateSchema, serviceListQuerySchema } from "@/features/services/schemas";
import { createService, listServices } from "@/features/services/server/service-repository";

export const GET = createRouteHandler(
  { permission: "services.read", query: serviceListQuerySchema },
  async ({ query }) => ok(await listServices(query)),
);

export const POST = createRouteHandler(
  { permission: "services.create", body: serviceCreateSchema },
  async ({ body, viewer }) => created(await createService(body, viewer.id)),
);
