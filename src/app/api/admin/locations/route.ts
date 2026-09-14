import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { locationCreateSchema } from "@/features/locations/schemas";
import { createLocation, listLocations } from "@/features/locations/server/location-repository";

export const GET = createRouteHandler({ permission: "locations.read" }, async () =>
  ok(await listLocations()),
);

export const POST = createRouteHandler(
  { permission: "locations.create", body: locationCreateSchema },
  async ({ body, viewer }) => created(await createLocation(body, viewer)),
);
