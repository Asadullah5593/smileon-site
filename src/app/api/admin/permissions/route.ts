import { createRouteHandler } from "@/shared/api/route-handler";
import { ok } from "@/shared/api/response";
import { PERMISSION_GROUPS, PERMISSION_RESOURCES, PERMISSIONS } from "@/shared/auth/permission-registry";

/**
 * The registry, served as-is. Read-only by design: permissions are defined in
 * code, so there is no create/update/delete here.
 */
export const GET = createRouteHandler({ permission: "roles.read" }, async () =>
  ok({
    groups: PERMISSION_GROUPS,
    resources: PERMISSION_RESOURCES,
    permissions: PERMISSIONS,
  }),
);
