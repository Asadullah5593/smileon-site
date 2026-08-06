import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "@/shared/utils/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Dental Implants")).toBe("dental-implants");
  });

  it("strips punctuation", () => {
    expect(slugify("Teeth Whitening — in 45 minutes!")).toBe("teeth-whitening-in-45-minutes");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when it is free", async () => {
    expect(await uniqueSlug("Root Canal", async () => false)).toBe("root-canal");
  });

  it("appends a counter until it finds a free slug", async () => {
    const taken = new Set(["root-canal", "root-canal-2"]);
    expect(await uniqueSlug("Root Canal", async (c) => taken.has(c))).toBe("root-canal-3");
  });

  it("falls back to `item` when the input has no usable characters", async () => {
    expect(await uniqueSlug("!!!", async () => false)).toBe("item");
  });
});
