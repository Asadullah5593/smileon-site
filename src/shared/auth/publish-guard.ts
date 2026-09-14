import { ForbiddenError } from "@/shared/api/errors";
import { viewerCan } from "@/shared/auth/permission-check";
import type { PermissionName } from "@/shared/auth/permission-registry";

/**
 * Enforcement for the `<resource>.publish` permissions.
 *
 * Without this every `*.publish` permission in the registry is decorative:
 * `serviceUpdateSchema` accepts `status`, so anyone holding `<resource>.update`
 * could take content live. The Author role — defined as "writes posts but
 * cannot publish" — could publish through `posts.update`.
 *
 * The rule is **visibility**, not the literal status value: you need
 * `<resource>.publish` to change whether the public site can see a record.
 *
 *   DRAFT     → PUBLISHED   publish        (goes live)
 *   PUBLISHED → DRAFT       publish        (taken offline)
 *   PUBLISHED → ARCHIVED    publish        (taken offline)
 *   DRAFT     → ARCHIVED    update only    (never was visible)
 *   ARCHIVED  → DRAFT       update only    (still not visible)
 *   create as PUBLISHED     publish
 *   create as DRAFT         update only
 *
 * Editing the body of an already-published record is an ordinary update — the
 * visibility did not change — so an Author can still fix a typo in their own
 * live post without being able to pull it down.
 */

type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Structural, so this module stays free of server-only imports and testable. */
type PermissionHolder = { isSuperAdmin: boolean; permissions: string[] };

const isPubliclyVisible = (status: PublishStatus | null | undefined) => status === "PUBLISHED";

/** True when moving from `current` to `next` changes public visibility. */
export function changesVisibility(
  next: PublishStatus | null | undefined,
  current?: PublishStatus | null,
): boolean {
  // `undefined` means the caller did not ask for a status change at all.
  if (next === undefined) return false;
  return isPubliclyVisible(next) !== isPubliclyVisible(current);
}

export function canSetStatus(
  viewer: PermissionHolder | null,
  resource: string,
  next: PublishStatus | null | undefined,
  current?: PublishStatus | null,
): boolean {
  if (!changesVisibility(next, current)) return true;
  return viewerCan(viewer, `${resource}.publish` satisfies PermissionName);
}

/**
 * Throws `ForbiddenError` unless the viewer may make this visibility change.
 * Call it in the repository, before the write, where `current` is already loaded.
 */
export function assertCanSetStatus(
  viewer: PermissionHolder | null,
  resource: string,
  next: PublishStatus | null | undefined,
  current?: PublishStatus | null,
): void {
  if (canSetStatus(viewer, resource, next, current)) return;

  throw new ForbiddenError(
    isPubliclyVisible(next)
      ? "You do not have permission to publish this."
      : "You do not have permission to take this off the website.",
    [`${resource}.publish`],
  );
}
