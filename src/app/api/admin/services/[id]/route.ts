import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { serviceUpdateSchema } from "@/features/services/schemas";
import {
  deleteService,
  getServiceById,
  updateService,
} from "@/features/services/server/service-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "services.read", params: paramsSchema },
  async ({ params }) => ok(await getServiceById(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "services.update", params: paramsSchema, body: serviceUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateService(params.id, body, viewer.id)),
);

export const DELETE = createRouteHandler(
  { permission: "services.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteService(params.id, viewer.id);
    return noContent();
  },
);
