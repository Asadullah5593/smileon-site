import { z } from "zod";
import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent, ok } from "@/shared/api/response";
import { bannerUpdateSchema } from "@/features/banners/schemas";
import {
  deleteBanner,
  getBannerById,
  updateBanner,
} from "@/features/banners/server/banner-repository";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = createRouteHandler(
  { permission: "banners.read", params: paramsSchema },
  async ({ params }) => ok(await getBannerById(params.id)),
);

export const PATCH = createRouteHandler(
  { permission: "banners.update", params: paramsSchema, body: bannerUpdateSchema },
  async ({ params, body, viewer }) => ok(await updateBanner(params.id, body, viewer)),
);

export const DELETE = createRouteHandler(
  { permission: "banners.delete", params: paramsSchema },
  async ({ params, viewer }) => {
    await deleteBanner(params.id, viewer);
    return noContent();
  },
);
