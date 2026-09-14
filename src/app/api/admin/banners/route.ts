import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { bannerCreateSchema } from "@/features/banners/schemas";
import { createBanner, listBanners } from "@/features/banners/server/banner-repository";

export const GET = createRouteHandler({ permission: "banners.read" }, async () =>
  ok(await listBanners()),
);

export const POST = createRouteHandler(
  { permission: "banners.create", body: bannerCreateSchema },
  async ({ body, viewer }) => created(await createBanner(body, viewer)),
);
