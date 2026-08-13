import { describe, expect, it } from "vitest";
import {
  taxonomyCreateSchema,
  taxonomyListQuerySchema,
  taxonomyUpdateSchema,
} from "@/features/taxonomy/schemas";

describe("taxonomyCreateSchema", () => {
  it("accepts each of the three kinds", () => {
    for (const kind of ["category", "tag", "serviceCategory"] as const) {
      expect(taxonomyCreateSchema.safeParse({ kind, name: "Cosmetic" }).success).toBe(true);
    }
  });

  it("rejects an unknown kind", () => {
    expect(taxonomyCreateSchema.safeParse({ kind: "author", name: "X" }).success).toBe(false);
  });

  it("requires a name of at least two characters", () => {
    expect(taxonomyCreateSchema.safeParse({ kind: "tag", name: "x" }).success).toBe(false);
  });

  it("defaults sortOrder to zero", () => {
    expect(taxonomyCreateSchema.parse({ kind: "tag", name: "Braces" }).sortOrder).toBe(0);
  });
});

describe("taxonomyUpdateSchema", () => {
  // `kind` selects which table to write to, so it stays required on update.
  it("still requires kind", () => {
    expect(taxonomyUpdateSchema.safeParse({ name: "Renamed" }).success).toBe(false);
    expect(taxonomyUpdateSchema.safeParse({ kind: "tag", name: "Renamed" }).success).toBe(true);
  });

  it("allows a rename without touching anything else", () => {
    expect(taxonomyUpdateSchema.parse({ kind: "category", name: "Oral surgery" })).toMatchObject({
      kind: "category",
      name: "Oral surgery",
    });
  });
});

describe("taxonomyListQuerySchema", () => {
  it("requires a kind to know which table to list", () => {
    expect(taxonomyListQuerySchema.safeParse({}).success).toBe(false);
    expect(taxonomyListQuerySchema.safeParse({ kind: "tag" }).success).toBe(true);
  });
});
