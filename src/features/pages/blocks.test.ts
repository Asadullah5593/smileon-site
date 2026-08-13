import { describe, expect, it } from "vitest";
import {
  BLOCK_TYPES,
  blockSchema,
  blocksSchema,
  emptyBlock,
  parseBlocks,
  type BlockType,
} from "@/features/pages/blocks";

const types = BLOCK_TYPES.map((entry) => entry.type);

describe("emptyBlock", () => {
  it("produces a valid block for every declared type", () => {
    for (const type of types) {
      const block = emptyBlock(type, "id-1");
      expect(blockSchema.safeParse(block).success, `${type} is not schema-valid`).toBe(true);
    }
  });

  it("covers every type in the union — no type can ship without a constructor", () => {
    expect(types.sort()).toEqual(
      blockSchema.options.map((o) => o.shape.type.value as BlockType).sort(),
    );
  });

  it("gives list blocks a sensible starting count", () => {
    expect(emptyBlock("team", "a")).toMatchObject({ limit: 8 });
    expect(emptyBlock("testimonials", "a")).toMatchObject({ limit: 3 });
    expect(emptyBlock("gallery", "a")).toMatchObject({ limit: 4 });
  });
});

describe("blockSchema", () => {
  it("rejects an unknown block type", () => {
    expect(blockSchema.safeParse({ id: "a", type: "carousel" }).success).toBe(false);
  });

  it("requires an id, so reordering cannot key on the index", () => {
    expect(blockSchema.safeParse({ type: "team", limit: 4 }).success).toBe(false);
  });

  it("bounds the count so a page cannot ask for the whole table", () => {
    expect(blockSchema.safeParse({ id: "a", type: "testimonials", limit: 25 }).success).toBe(false);
    expect(blockSchema.safeParse({ id: "a", type: "testimonials", limit: 0 }).success).toBe(false);
    expect(blockSchema.safeParse({ id: "a", type: "team", limit: 48 }).success).toBe(true);
  });

  // Input and output must match, or the form values and the editor component
  // disagree about the same block — see the note in blocks.ts.
  it("does not coerce the count, so a string is rejected rather than silently cast", () => {
    expect(blockSchema.safeParse({ id: "a", type: "team", limit: "8" }).success).toBe(false);
  });

  it("caps how many sections one page can have", () => {
    const many = Array.from({ length: 41 }, (_, i) => emptyBlock("richText", `id-${i}`));
    expect(blocksSchema.safeParse(many).success).toBe(false);
  });
});

describe("parseBlocks", () => {
  it("returns an empty list for a page that has none", () => {
    expect(parseBlocks(null)).toEqual([]);
    expect(parseBlocks(undefined)).toEqual([]);
    expect(parseBlocks({})).toEqual([]);
  });

  // A hand-edited row must not take the whole page down.
  it("drops unparseable blocks and keeps the rest", () => {
    const good = emptyBlock("team", "keep");
    const result = parseBlocks([good, { id: "bad", type: "nonsense" }, "not an object"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("keep");
  });

  // A cache entry written before `blocks` existed on the DTO comes back
  // without the field; the page must still render.
  it("treats a missing value as no blocks", () => {
    expect(parseBlocks(undefined)).toEqual([]);
    expect(parseBlocks("")).toEqual([]);
    expect(parseBlocks(0)).toEqual([]);
  });

  it("round-trips what the editor produces", () => {
    const blocks = types.map((type, i) => emptyBlock(type, `id-${i}`));
    expect(parseBlocks(JSON.parse(JSON.stringify(blocks)))).toHaveLength(blocks.length);
  });
});
