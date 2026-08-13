import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { galleryCreateSchema, galleryListQuerySchema } from "@/features/gallery/schemas";
import { createGalleryCase, listGalleryCases } from "@/features/gallery/server/gallery-repository";

export const GET = createRouteHandler(
  { permission: "gallery.read", query: galleryListQuerySchema },
  async ({ query }) => ok(await listGalleryCases(query)),
);

export const POST = createRouteHandler(
  { permission: "gallery.create", body: galleryCreateSchema },
  async ({ body, viewer }) => created(await createGalleryCase(body, viewer)),
);
