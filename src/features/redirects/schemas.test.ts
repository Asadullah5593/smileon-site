import { describe, expect, it } from "vitest";
import { parseBulkRedirects, redirectCreateSchema } from "@/features/redirects/schemas";

describe("redirectCreateSchema", () => {
  it("accepts a path-to-path redirect and defaults to permanent", () => {
    const result = redirectCreateSchema.parse({ source: "/old", target: "/new" });
    expect(result).toEqual({ source: "/old", target: "/new", permanent: true });
  });

  it("accepts an absolute URL as the target", () => {
    expect(
      redirectCreateSchema.safeParse({ source: "/old", target: "https://example.com" }).success,
    ).toBe(true);
  });

  it("requires the source to be a site-relative path", () => {
    for (const source of ["old-page", "https://example.com/old", ""]) {
      expect(redirectCreateSchema.safeParse({ source, target: "/new" }).success).toBe(false);
    }
  });

  it("strips a trailing slash so /old and /old/ are one rule", () => {
    expect(redirectCreateSchema.parse({ source: "/old/", target: "/new" }).source).toBe("/old");
  });

  it("keeps the root path intact", () => {
    expect(redirectCreateSchema.parse({ source: "/", target: "/home" }).source).toBe("/");
  });

  // The one-hop loop; multi-hop chains are caught in the repository.
  it("rejects a redirect pointing at itself", () => {
    const result = redirectCreateSchema.safeParse({ source: "/loop", target: "/loop" });
    expect(result.success).toBe(false);
  });

  it("treats /old and /old/ as self-referential", () => {
    expect(redirectCreateSchema.safeParse({ source: "/loop/", target: "/loop" }).success).toBe(
      false,
    );
  });
});

describe("parseBulkRedirects", () => {
  it("parses one redirect per line", () => {
    const { rows, errors } = parseBulkRedirects("/a,/b\n/c,/d");
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { source: "/a", target: "/b", permanent: true },
      { source: "/c", target: "/d", permanent: true },
    ]);
  });

  it("reads a third column as the permanent flag", () => {
    expect(parseBulkRedirects("/a,/b,false").rows[0].permanent).toBe(false);
    expect(parseBulkRedirects("/a,/b,true").rows[0].permanent).toBe(true);
  });

  it("skips blank lines and # comments", () => {
    expect(parseBulkRedirects("\n# a note\n/a,/b\n\n").rows).toHaveLength(1);
  });

  // A 60-line paste with one typo should import 59, not fail entirely.
  it("reports bad lines without discarding the good ones", () => {
    const { rows, errors } = parseBulkRedirects("/a,/b\nnonsense\n/c,/d");
    expect(rows).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ line: 2, text: "nonsense" });
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseBulkRedirects("  /a , /b  ").rows[0]).toEqual({
      source: "/a",
      target: "/b",
      permanent: true,
    });
  });
});
