import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { galleryUpdateSchema } from "@/features/gallery/schemas";
import {
  deleteGalleryCase,
  getGalleryCaseById,
  updateGalleryCase,
} from "@/features/gallery/server/gallery-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "gallery.read", params: paramsSchema },
  async ({ params }) => ok(await getGalleryCaseById(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "gallery.update", params: paramsSchema, body: galleryUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateGalleryCase(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "gallery.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteGalleryCase(params.id, viewer);
    return noContent();
  },
);
