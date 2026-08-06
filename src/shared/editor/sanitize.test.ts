import { describe, expect, it } from "vitest";
import { htmlToText, sanitizeHtml } from "@/shared/editor/sanitize";

describe("sanitizeHtml", () => {
  it("keeps allowed formatting", () => {
    expect(sanitizeHtml("<p>Hello <strong>world</strong></p>")).toBe(
      "<p>Hello <strong>world</strong></p>",
    );
  });

  it("strips script tags", () => {
    expect(sanitizeHtml('<p>ok</p><script>alert("xss")</script>')).toBe("<p>ok</p>");
  });

  it("strips inline event handlers", () => {
    expect(sanitizeHtml('<p onclick="steal()">hi</p>')).toBe("<p>hi</p>");
  });

  it("removes javascript: links", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });

  it("allows http, mailto and relative links", () => {
    const html = sanitizeHtml(
      '<a href="https://smileon.pk">a</a><a href="mailto:a@b.c">b</a><a href="/services">c</a>',
    );
    expect(html).toContain("https://smileon.pk");
    expect(html).toContain("mailto:a@b.c");
    expect(html).toContain("/services");
  });
});

describe("htmlToText", () => {
  it("strips tags and collapses whitespace", () => {
    expect(htmlToText("<p>Hello  <em>there</em></p>")).toBe("Hello there");
  });

  it("truncates with an ellipsis", () => {
    expect(htmlToText("<p>abcdefghij</p>", 5)).toBe("abcd…");
  });
});
