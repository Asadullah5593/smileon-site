import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { locationUpdateSchema } from "@/features/locations/schemas";
import {
  deleteLocation,
  getLocationById,
  updateLocation,
} from "@/features/locations/server/location-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "locations.read", params: paramsSchema },
  async ({ params }) => ok(await getLocationById(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "locations.update", params: paramsSchema, body: locationUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateLocation(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "locations.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteLocation(params.id, viewer);
    return noContent();
  },
);
