import { describe, expect, it } from "vitest";
import {
  isReservedSlug,
  orderedStatusSchema,
  pathSlugSchema,
  publishableSchema,
  publishedAtOnCreate,
  publishedAtOnUpdate,
  slugSchema,
  statusSchema,
} from "@/shared/content/publishable";

describe("publishableSchema", () => {
  it("defaults to an unpublished, unindexed draft", () => {
    expect(publishableSchema.parse({})).toMatchObject({
      status: "DRAFT",
      sortOrder: 0,
      noIndex: false,
    });
  });

  it("coerces sortOrder from a form string", () => {
    expect(publishableSchema.parse({ sortOrder: "12" }).sortOrder).toBe(12);
  });

  it("rejects an unknown status", () => {
    expect(publishableSchema.safeParse({ status: "LIVE" }).success).toBe(false);
  });

  it("caps SEO fields at search-result lengths", () => {
    expect(publishableSchema.safeParse({ seoTitle: "x".repeat(71) }).success).toBe(false);
    expect(publishableSchema.safeParse({ seoDescription: "x".repeat(181) }).success).toBe(false);
  });
});

describe("the composable blocks", () => {
  // Not every publishable model has every column: pages and posts have no
  // sortOrder, and only services/pages/posts have the SEO fields.
  it("statusSchema carries status alone", () => {
    expect(Object.keys(statusSchema.shape)).toEqual(["status"]);
  });

  it("orderedStatusSchema adds sortOrder", () => {
    expect(Object.keys(orderedStatusSchema.shape).sort()).toEqual(["sortOrder", "status"]);
  });

  it("publishableSchema adds the SEO columns on top", () => {
    expect(Object.keys(publishableSchema.shape)).toContain("seoTitle");
    expect(Object.keys(publishableSchema.shape)).toContain("sortOrder");
  });
});

describe("pathSlugSchema", () => {
  it("accepts a nested page address", () => {
    expect(pathSlugSchema.parse("about-us/our-values")).toBe("about-us/our-values");
  });

  it("accepts a single segment", () => {
    expect(pathSlugSchema.parse("about")).toBe("about");
  });

  it("rejects leading, trailing or doubled slashes", () => {
    for (const bad of ["/about", "about/", "about//values"]) {
      expect(pathSlugSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("rejects uppercase and spaces", () => {
    expect(pathSlugSchema.safeParse("About/Values").success).toBe(false);
    expect(pathSlugSchema.safeParse("about us/values").success).toBe(false);
  });
});

describe("isReservedSlug", () => {
  // A page slugged `services` would never render — the real route wins.
  it("flags slugs that collide with a real route", () => {
    for (const slug of ["services", "blog", "admin", "api", "login", "team"]) {
      expect(isReservedSlug(slug)).toBe(true);
    }
  });

  it("flags a nested slug by its first segment", () => {
    expect(isReservedSlug("admin/secret")).toBe(true);
  });

  it("allows an ordinary page address", () => {
    expect(isReservedSlug("about")).toBe(false);
    expect(isReservedSlug("about/our-values")).toBe(false);
  });

  it("does not flag a slug that merely starts with a reserved word", () => {
    expect(isReservedSlug("services-we-offer")).toBe(false);
  });
});

describe("slugSchema", () => {
  it("accepts lowercase, digits and hyphens", () => {
    expect(slugSchema.parse("dental-implants-2")).toBe("dental-implants-2");
  });

  it("rejects spaces, uppercase and punctuation", () => {
    for (const bad of ["Dental Implants", "Implants", "implants!", "implants/x"]) {
      expect(slugSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("is optional, so the title can generate one", () => {
    expect(slugSchema.safeParse(undefined).success).toBe(true);
  });
});

describe("publishedAtOnCreate", () => {
  it("stamps a date only when created live", () => {
    expect(publishedAtOnCreate("PUBLISHED")).toBeInstanceOf(Date);
    expect(publishedAtOnCreate("DRAFT")).toBeNull();
    expect(publishedAtOnCreate("ARCHIVED")).toBeNull();
    expect(publishedAtOnCreate(undefined)).toBeNull();
  });
});

describe("publishedAtOnUpdate", () => {
  const draft = { status: "DRAFT" as const, publishedAt: null };

  it("stamps the first time a draft goes live", () => {
    expect(publishedAtOnUpdate("PUBLISHED", draft).publishedAt).toBeInstanceOf(Date);
  });

  it("keeps the original date so it doesn't jump on re-publish", () => {
    const original = new Date("2026-01-01T00:00:00Z");
    const archived = { status: "ARCHIVED" as const, publishedAt: original };
    expect(publishedAtOnUpdate("PUBLISHED", archived).publishedAt).toBe(original);
  });

  it("leaves publishedAt untouched for an ordinary edit", () => {
    const live = { status: "PUBLISHED" as const, publishedAt: new Date() };
    expect(publishedAtOnUpdate("PUBLISHED", live)).toEqual({});
    expect(publishedAtOnUpdate(undefined, live)).toEqual({});
  });

  it("does not clear the date when a record is taken down", () => {
    const live = { status: "PUBLISHED" as const, publishedAt: new Date() };
    expect(publishedAtOnUpdate("DRAFT", live)).toEqual({});
  });
});
