import { createRouteHandler } from "@/shared/api/route-handler";
import { created, ok } from "@/shared/api/response";
import { ValidationError } from "@/shared/api/errors";
import { mediaListQuerySchema } from "@/features/media/schemas";
import { listMedia, uploadMedia } from "@/features/media/server/media-service";

export const GET = createRouteHandler(
  { permission: "media.read", query: mediaListQuerySchema },
  async ({ query }) => ok(await listMedia(query)),
);

/**
 * Multipart upload. No `body` schema is declared, so the wrapper never touches
 * the request body and the handler reads the form itself — which means uploads
 * still get permission enforcement, error mapping, access logging and the
 * `X-Request-Id` header like every other endpoint.
 */
export const POST = createRouteHandler({ permission: "media.upload" }, async ({ req, viewer }) => {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ValidationError({ file: "missing" }, "No file was uploaded.");
  }

  const folder = form.get("folder");
  const media = await uploadMedia(file, {
    folder: typeof folder === "string" ? folder : undefined,
    userId: viewer.id,
  });

  return created(media);
});
