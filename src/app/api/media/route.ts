import { createRouteHandler } from "@/shared/api/route-handler";
import { toErrorResponse } from "@/shared/api/error-response";
import { created, ok } from "@/shared/api/response";
import { ValidationError } from "@/shared/api/errors";
import { requirePermission } from "@/shared/auth/permissions";
import { mediaListQuerySchema } from "@/features/media/schemas";
import { listMedia, uploadMedia } from "@/features/media/server/media-service";

export const GET = createRouteHandler(
  { permission: "media.read", query: mediaListQuerySchema },
  async ({ query }) => ok(await listMedia(query)),
);

// Multipart uploads bypass the wrapper's JSON body parsing.
export async function POST(req: Request) {
  try {
    const viewer = await requirePermission("media.upload");

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
  } catch (error) {
    return toErrorResponse(error);
  }
}
