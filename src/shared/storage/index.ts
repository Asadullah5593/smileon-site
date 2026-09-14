import "server-only";
import { env } from "@/shared/config/env";
import { localDriver } from "@/shared/storage/local-driver";
import { s3Driver } from "@/shared/storage/s3-driver";

export type StoredObject = { key: string; size: number };

/**
 * Storage is an interface, not a hard dependency, so switching from the local
 * disk to S3/R2 is `STORAGE_DRIVER=s3` in the environment — no code changes.
 */
export type StorageDriver = {
  readonly name: string;
  put(key: string, data: Buffer, contentType: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  /** Public URL for a stored key. */
  url(key: string): string;
};

export const storage: StorageDriver = env.STORAGE_DRIVER === "s3" ? s3Driver : localDriver;

/** Resolve a media key (or a full URL that was pasted in) to something renderable. */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return storage.url(key);
}
