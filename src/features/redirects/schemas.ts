import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";

/** A source path: site-relative, leading slash, no scheme or host. */
const sourcePath = z
  .string()
  .trim()
  .min(1, "Where is the visitor coming from?")
  .max(500)
  .regex(/^\/[^\s?#]*$/, "Start with / and use a path, e.g. /old-page.")
  .transform((value) => (value.length > 1 ? value.replace(/\/+$/, "") : value));

/** A target: a site-relative path or a full URL. */
const targetPath = z
  .string()
  .trim()
  .min(1, "Where should they end up?")
  .max(500)
  .regex(/^(\/[^\s]*|https?:\/\/\S+)$/, "Use a path like /new-page or a full https:// URL.");

export const redirectCreateSchema = z
  .object({
    source: sourcePath,
    target: targetPath,
    permanent: z.boolean().default(true),
  })
  .refine((value) => value.source !== value.target, {
    message: "A redirect cannot point at itself.",
    path: ["target"],
  });

export const redirectUpdateSchema = z.object({
  source: sourcePath.optional(),
  target: targetPath.optional(),
  permanent: z.boolean().optional(),
});

export const redirectListQuerySchema = listQuerySchema;

/** Bulk paste: one `source,target[,permanent]` per line. */
export const redirectBulkSchema = z.object({
  text: z.string().min(1).max(50_000),
});

export type RedirectCreateInput = z.output<typeof redirectCreateSchema>;
export type RedirectUpdateInput = z.output<typeof redirectUpdateSchema>;
export type RedirectFormValues = z.input<typeof redirectCreateSchema>;
export type RedirectListQuery = z.infer<typeof redirectListQuerySchema>;

export type RedirectDto = {
  id: string;
  source: string;
  target: string;
  permanent: boolean;
  createdAt: string;
};

export type BulkParseResult = {
  rows: { source: string; target: string; permanent: boolean }[];
  errors: { line: number; text: string; reason: string }[];
};

/**
 * Parse pasted CSV-ish text into redirect rows, reporting bad lines rather than
 * failing the whole paste — a 60-line list with one typo should import 59.
 */
export function parseBulkRedirects(text: string): BulkParseResult {
  const rows: BulkParseResult["rows"] = [];
  const errors: BulkParseResult["errors"] = [];

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;

    const [source, target, permanent] = line.split(",").map((part) => part?.trim());
    const parsed = redirectCreateSchema.safeParse({
      source,
      target,
      permanent: permanent === undefined ? true : permanent.toLowerCase() !== "false",
    });

    if (parsed.success) rows.push(parsed.data);
    else {
      errors.push({
        line: index + 1,
        text: line,
        reason: parsed.error.issues[0]?.message ?? "Invalid",
      });
    }
  });

  return { rows, errors };
}
