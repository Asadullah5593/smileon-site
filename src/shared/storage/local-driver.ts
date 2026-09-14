import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from "@/shared/storage";

/** Files land in `public/uploads/<key>` and are served by Next as static assets. */
const ROOT = path.join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads";

function resolve(key: string) {
  const target = path.join(ROOT, key);
  // Refuse anything that escapes the uploads root (`../../etc/passwd`).
  if (!target.startsWith(ROOT + path.sep)) {
    throw new Error(`Refusing to write outside the uploads directory: ${key}`);
  }
  return target;
}

export const localDriver: StorageDriver = {
  name: "local",

  async put(key, data) {
    const target = resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
    return { key, size: data.byteLength };
  },

  async delete(key) {
    try {
      await unlink(resolve(key));
    } catch (error) {
      // Deleting an already-missing file is not an error worth surfacing.
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  },

  url(key) {
    return `${PUBLIC_PREFIX}/${key}`;
  },
};
