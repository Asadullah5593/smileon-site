import "server-only";
import { prisma } from "@/shared/db/prisma";
import { ValidationError } from "@/shared/api/errors";
import { recordAudit } from "@/shared/audit/audit-log";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import {
  SETTING_KEYS,
  SETTING_SCHEMAS,
  parseSetting,
  type SettingKey,
  type SettingValues,
} from "@/features/settings/schemas";
import type { Viewer } from "@/shared/auth/permissions";
import { z } from "zod";

/** All `SiteSetting` data access. */

/** One key, defaults applied. Never throws — see `parseSetting`. */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValues[K]> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return parseSetting(key, row?.value);
}

/** Every group, defaults applied — what the settings screen renders. */
export async function getAllSettings(): Promise<SettingValues> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: SETTING_KEYS } } });
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  return Object.fromEntries(
    SETTING_KEYS.map((key) => [key, parseSetting(key, stored.get(key))]),
  ) as SettingValues;
}

export async function updateSetting<K extends SettingKey>(
  key: K,
  value: unknown,
  viewer: Viewer,
): Promise<SettingValues[K]> {
  // Writes are strict even though reads are lenient: nothing invalid should
  // enter the table in the first place.
  //
  // Widened to `ZodType` because `SETTING_SCHEMAS[key]` is a union of five
  // schemas, and `flattenError` cannot narrow the matching union of errors.
  const schema: z.ZodType = SETTING_SCHEMAS[key];
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(z.flattenError(parsed.error), "Those settings aren't valid.");
  }

  const data = parsed.data as SettingValues[K];

  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: data },
    create: { key, value: data },
  });

  await recordAudit({
    actorId: viewer.id,
    action: "settings.manage",
    entity: "SiteSetting",
    entityId: key,
    summary: `Updated ${key} settings`,
  });
  revalidateContent(CACHE_TAGS.settings);

  return data;
}
