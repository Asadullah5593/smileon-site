import "server-only";
import { env } from "@/shared/config/env";
import type { StorageDriver } from "@/shared/storage";

/**
 * S3 / Cloudflare R2 driver.
 *
 * Deliberately unimplemented until a bucket exists — install
 * `@aws-sdk/client-s3` and fill in the three methods below, then set
 * `STORAGE_DRIVER=s3`. Everything else in the app already goes through the
 * `StorageDriver` interface, so nothing else has to change.
 */
function notImplemented(): never {
  throw new Error(
    "The S3 storage driver is not implemented yet. Install @aws-sdk/client-s3 and " +
      "complete src/shared/storage/s3-driver.ts, or set STORAGE_DRIVER=local.",
  );
}

export const s3Driver: StorageDriver = {
  name: "s3",

  async put() {
    notImplemented();
  },

  async delete() {
    notImplemented();
  },

  url(key) {
    const base = env.S3_PUBLIC_URL?.replace(/\/$/, "");
    if (!base) notImplemented();
    return `${base}/${key}`;
  },
};
