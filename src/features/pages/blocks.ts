import { z } from "zod";

/**
 * Page blocks — the typed sections a page is assembled from.
 *
 * A page is an ordered list of these, stored in the `Page.blocks` JSON column.
 * `bodyHtml` is still there and still rendered first, so every existing page
 * keeps working; blocks are additive.
 *
 * Adding a block type means: one entry in this union, one entry in
 * `BLOCK_TYPES`, one settings fieldset in `BlockEditor`, and one case in
 * `PageBlocks`. Nothing else.
 */

/** Every block carries an id so the editor can key and reorder without index bugs. */
const base = { id: z.string().min(1) };

const heading = z.string().trim().max(160).nullish();

/**
 * `html` and `limit` are required rather than defaulted, and `limit` is a plain
 * number rather than `z.coerce`. Either would make the schema's *input* type
 * differ from its output, so the form values and the editor component would
 * disagree about the same block. `emptyBlock` supplies both explicitly, so
 * nothing needs a default.
 */
const limit = (max: number) => z.number().int().min(1).max(max);

export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("richText"),
    html: z.string().max(400_000),
  }),
  z.object({
    ...base,
    type: z.literal("banner"),
    /** A specific banner, or the first active one when null. */
    bannerId: z.string().nullish(),
  }),
  z.object({
    ...base,
    type: z.literal("team"),
    heading,
    limit: limit(48),
  }),
  z.object({
    ...base,
    type: z.literal("testimonials"),
    heading,
    limit: limit(24),
  }),
  z.object({
    ...base,
    type: z.literal("faqs"),
    heading,
    /** Empty shows every group. */
    group: z.string().trim().max(40).nullish(),
  }),
  z.object({
    ...base,
    type: z.literal("gallery"),
    heading,
    limit: limit(24),
  }),
  z.object({
    ...base,
    type: z.literal("appointmentForm"),
    heading,
  }),
]);

export const blocksSchema = z.array(blockSchema).max(40).default([]);

export type PageBlock = z.output<typeof blockSchema>;
export type BlockType = PageBlock["type"];

export const BLOCK_TYPES: { type: BlockType; label: string; description: string }[] = [
  { type: "richText", label: "Text", description: "A paragraph or two of formatted copy." },
  { type: "banner", label: "Banner", description: "A full-width hero with a call to action." },
  { type: "team", label: "Team", description: "Published team members, in order." },
  { type: "testimonials", label: "Testimonials", description: "Published patient quotes." },
  { type: "faqs", label: "FAQs", description: "Published questions, optionally one group." },
  { type: "gallery", label: "Before & after", description: "Published treatment cases." },
  {
    type: "appointmentForm",
    label: "Appointment form",
    description: "The booking form, same as /contact.",
  },
];

export const BLOCK_LABELS = Object.fromEntries(
  BLOCK_TYPES.map((entry) => [entry.type, entry.label]),
) as Record<BlockType, string>;

/** A new block of the given type, ready to edit. */
export function emptyBlock(type: BlockType, id: string): PageBlock {
  switch (type) {
    case "richText":
      return { id, type, html: "" };
    case "banner":
      return { id, type, bannerId: null };
    case "team":
      return { id, type, heading: null, limit: 8 };
    case "testimonials":
      return { id, type, heading: null, limit: 3 };
    case "faqs":
      return { id, type, heading: null, group: null };
    case "gallery":
      return { id, type, heading: null, limit: 4 };
    case "appointmentForm":
      return { id, type, heading: null };
  }
}

/**
 * Read the JSON column leniently. A hand-edited or half-migrated row must not
 * take the public page down, so unparseable blocks are dropped rather than
 * thrown — the rest of the page still renders.
 */
export function parseBlocks(value: unknown): PageBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const result = blockSchema.safeParse(entry);
    return result.success ? [result.data] : [];
  });
}
