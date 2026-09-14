import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent } from "@/shared/api/response";
import { requireUser } from "@/shared/auth/permissions";
import { clientKey, rateLimit } from "@/shared/api/rate-limit";
import { passwordChangeSchema } from "@/features/profile/schemas";
import { changeOwnPassword } from "@/features/profile/server/profile-repository";

export const POST = createRouteHandler({ body: passwordChangeSchema }, async ({ req, body }) => {
  const viewer = await requireUser();
  // Rate limited so the current-password check can't be brute forced.
  rateLimit(clientKey(req, `password-change:${viewer.id}`), 5, 60_000);

  await changeOwnPassword(viewer.id, body);
  return noContent();
});
