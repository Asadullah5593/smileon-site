import { describe, expect, it } from "vitest";
import { postCreateSchema, postListQuerySchema } from "@/features/posts/schemas";

const valid = { title: "How much do braces cost?" };

describe("postCreateSchema", () => {
  it("accepts a minimal draft", () => {
    const result = postCreateSchema.parse(valid);
    expect(result).toMatchObject({ status: "DRAFT", categoryIds: [], tagIds: [] });
  });

  it("has no sortOrder — the blog orders by publish date", () => {
    expect(Object.keys(postCreateSchema.shape)).not.toContain("sortOrder");
  });

  it("carries the SEO columns", () => {
    expect(Object.keys(postCreateSchema.shape)).toEqual(
      expect.arrayContaining(["seoTitle", "seoDescription", "ogImageId", "noIndex"]),
    );
  });

  it("does not accept readMinutes — it is derived from the body", () => {
    const parsed = postCreateSchema.parse({ ...valid, readMinutes: 99 }) as Record<string, unknown>;
    expect(parsed.readMinutes).toBeUndefined();
  });

  it("rejects a slug with spaces or slashes", () => {
    expect(postCreateSchema.safeParse({ ...valid, slug: "braces cost" }).success).toBe(false);
    expect(postCreateSchema.safeParse({ ...valid, slug: "blog/braces" }).success).toBe(false);
  });

  it("caps how many categories and tags one post can carry", () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => `id-${i}`);
    expect(postCreateSchema.safeParse({ ...valid, categoryIds: many(11) }).success).toBe(false);
    expect(postCreateSchema.safeParse({ ...valid, tagIds: many(21) }).success).toBe(false);
    expect(postCreateSchema.safeParse({ ...valid, categoryIds: many(10) }).success).toBe(true);
  });
});

describe("postListQuerySchema", () => {
  it("accepts category and tag filters", () => {
    const result = postListQuerySchema.parse({ categoryId: "c1", tagId: "t1" });
    expect(result).toMatchObject({ categoryId: "c1", tagId: "t1" });
  });

  it("rejects an unknown status", () => {
    expect(postListQuerySchema.safeParse({ status: "LIVE" }).success).toBe(false);
  });
});
