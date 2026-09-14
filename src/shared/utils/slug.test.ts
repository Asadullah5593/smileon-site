import { describe, expect, it } from "vitest";
import { slugify, slugifyPath, uniqueSlug } from "@/shared/utils/slug";

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

  it("accepts a normalizer so page slugs can nest", async () => {
    expect(await uniqueSlug("About Us/Our Values", async () => false, slugifyPath)).toBe(
      "about-us/our-values",
    );
  });
});

describe("slugifyPath", () => {
  // `slugify` runs with strict:true, which drops "/" — passing a nested path
  // through it would silently produce "about-usour-values".
  it("keeps the separator that plain slugify would eat", () => {
    expect(slugify("about-us/our-values")).toBe("about-usour-values");
    expect(slugifyPath("about-us/our-values")).toBe("about-us/our-values");
  });

  it("slugifies each segment independently", () => {
    expect(slugifyPath("Patient Safety/4 Step Sterilisation")).toBe(
      "patient-safety/4-step-sterilisation",
    );
  });

  it("drops empty segments from stray slashes", () => {
    expect(slugifyPath("/about//values/")).toBe("about/values");
  });

  it("handles a single segment like slugify", () => {
    expect(slugifyPath("About Us")).toBe("about-us");
  });
});
