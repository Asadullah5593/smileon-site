import { createRouteHandler } from "@/shared/api/route-handler";
import { noContent } from "@/shared/api/response";
import { clientKey, rateLimit } from "@/shared/api/rate-limit";
import { passwordResetRequestSchema, passwordResetSchema } from "@/features/auth/schemas";
import {
  requestPasswordReset,
  resetPassword,
} from "@/features/auth/server/password-reset-repository";

/**
 * Request a reset link. Always answers 204, whether or not the address has an
 * account — a different response for unknown emails is an enumeration oracle.
 */
export const POST = createRouteHandler(
  { body: passwordResetRequestSchema },
  async ({ req, body }) => {
    rateLimit(clientKey(req, "password-reset"), 5, 15 * 60_000);
    await requestPasswordReset(body);
    return noContent();
  },
);

/** Consume a token and set the new password. */
export const PUT = createRouteHandler({ body: passwordResetSchema }, async ({ req, body }) => {
  rateLimit(clientKey(req, "password-reset-confirm"), 10, 15 * 60_000);
  await resetPassword(body);
  return noContent();
});
