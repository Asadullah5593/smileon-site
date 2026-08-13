import { z } from "zod";

/**
 * `SiteSetting` is a key → JSON table. Untyped JSON in, untyped JSON out is how
 * a typo in the CMS becomes a crash on the homepage, so every key gets its own
 * schema and is validated on write *and* on read.
 *
 * Adding a setting group means one entry in `SETTING_SCHEMAS` and one tab.
 */

const url = z.union([z.url(), z.literal("")]).default("");

export const brandSchema = z.object({
  name: z.string().trim().min(1).max(120).default("SmileOn Dental Clinic"),
  tagline: z.string().trim().max(200).default(""),
  logoMediaId: z.string().nullish(),
});

export const contactSchema = z.object({
  phone: z.string().trim().max(30).default(""),
  emergencyPhone: z.string().trim().max(30).default(""),
  whatsapp: z.string().trim().max(30).default(""),
  email: z.union([z.email(), z.literal("")]).default(""),
  /** Where appointment and contact notifications are sent. */
  notificationInbox: z.union([z.email(), z.literal("")]).default(""),
});

export const socialSchema = z.object({
  facebook: url,
  instagram: url,
  youtube: url,
  tiktok: url,
});

export const seoSettingsSchema = z.object({
  titleTemplate: z.string().trim().max(120).default("%s · SmileOn"),
  defaultDescription: z.string().trim().max(300).default(""),
  defaultOgImageId: z.string().nullish(),
  searchConsoleToken: z.string().trim().max(200).default(""),
  /** Kill switch: keeps the whole site out of search results. */
  noIndexSite: z.boolean().default(false),
});

export const analyticsSchema = z.object({
  ga4Id: z
    .string()
    .trim()
    .regex(/^(G-[A-Z0-9]+)?$/, "A GA4 id looks like G-XXXXXXX.")
    .max(40)
    .default(""),
  gtmId: z
    .string()
    .trim()
    .regex(/^(GTM-[A-Z0-9]+)?$/, "A GTM id looks like GTM-XXXXXX.")
    .max(40)
    .default(""),
  metaPixelId: z
    .string()
    .trim()
    .regex(/^\d*$/, "A Meta pixel id is digits only.")
    .max(40)
    .default(""),
});

export const SETTING_SCHEMAS = {
  brand: brandSchema,
  contact: contactSchema,
  social: socialSchema,
  seo: seoSettingsSchema,
  analytics: analyticsSchema,
} as const;

export type SettingKey = keyof typeof SETTING_SCHEMAS;
export const SETTING_KEYS = Object.keys(SETTING_SCHEMAS) as SettingKey[];

export type SettingValues = {
  [K in SettingKey]: z.output<(typeof SETTING_SCHEMAS)[K]>;
};

export const settingKeySchema = z.enum(SETTING_KEYS as [SettingKey, ...SettingKey[]]);

/** Body for `PUT /api/admin/settings/[key]` — validated against the key's schema. */
export const settingUpdateSchema = z.unknown();

export const SETTING_LABELS: Record<SettingKey, { title: string; description: string }> = {
  brand: { title: "Brand", description: "Clinic name, tagline and logo." },
  contact: { title: "Contact", description: "Numbers, email, and where enquiries are sent." },
  social: { title: "Social", description: "Profile links shown in the footer." },
  seo: { title: "SEO", description: "Defaults for titles, descriptions and indexing." },
  analytics: { title: "Analytics", description: "Measurement ids. Leave blank to disable." },
};

/**
 * Parse a stored value, falling back to the schema's defaults when the row is
 * missing or malformed. Reads never throw — a bad row must not take the site
 * down, it must fall back.
 */
export function parseSetting<K extends SettingKey>(key: K, value: unknown): SettingValues[K] {
  const schema = SETTING_SCHEMAS[key];
  const result = schema.safeParse(value ?? {});
  return (result.success ? result.data : schema.parse({})) as SettingValues[K];
}
