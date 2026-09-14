import { createRouteHandler } from "@/shared/api/route-handler";
import { ok } from "@/shared/api/response";
import { requireUser } from "@/shared/auth/permissions";
import { profileUpdateSchema } from "@/features/profile/schemas";
import { getProfile, updateProfile } from "@/features/profile/server/profile-repository";

// No `permission` option: every signed-in user may manage their own account.
// `requireUser()` still rejects anonymous callers, and the id comes from the
// resolved session rather than the request.
export const GET = createRouteHandler({}, async () => {
  const viewer = await requireUser();
  return ok(await getProfile(viewer.id));
});

export const PATCH = createRouteHandler({ body: profileUpdateSchema }, async ({ body }) => {
  const viewer = await requireUser();
  return ok(await updateProfile(viewer.id, body));
});
