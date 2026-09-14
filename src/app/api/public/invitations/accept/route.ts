import { createRouteHandler } from "@/shared/api/route-handler";
import { created } from "@/shared/api/response";
import { clientKey, rateLimit } from "@/shared/api/rate-limit";
import { inviteAcceptSchema } from "@/features/auth/schemas";
import { acceptInvitation } from "@/features/auth/server/invitation-repository";

// Public by necessity — the invitee has no account yet. The token is the
// credential, so this is rate limited against guessing.
export const POST = createRouteHandler({ body: inviteAcceptSchema }, async ({ req, body }) => {
  rateLimit(clientKey(req, "invite-accept"), 10, 15 * 60_000);
  return created(await acceptInvitation(body));
});
