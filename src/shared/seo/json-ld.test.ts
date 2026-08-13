import { describe, expect, it } from "vitest";
import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
  openingHoursSchema,
  personSchema,
} from "@/shared/seo/json-ld";

describe("articleSchema", () => {
  it("emits a BlogPosting with the required fields", () => {
    const result = articleSchema({ headline: "Braces cost", url: "https://x/blog/braces" });
    expect(result["@type"]).toBe("BlogPosting");
    expect(result.headline).toBe("Braces cost");
  });

  it("omits optional fields rather than emitting nulls", () => {
    const result = articleSchema({ headline: "H", url: "u", description: null, image: null });
    expect(result).not.toHaveProperty("description");
    expect(result).not.toHaveProperty("image");
    expect(result).not.toHaveProperty("author");
  });

  it("nests the author as a Person", () => {
    const result = articleSchema({ headline: "H", url: "u", authorName: "Dr Khan" });
    expect(result.author).toEqual({ "@type": "Person", name: "Dr Khan" });
  });
});

describe("personSchema", () => {
  it("uses Physician, which is what a clinic profile is", () => {
    expect(personSchema({ name: "Dr Khan", url: "u" })["@type"]).toBe("Physician");
  });
});

describe("openingHoursSchema", () => {
  const open = { closed: false, open: "09:00", close: "17:00" };

  it("maps a day to the schema.org URL form", () => {
    const [entry] = openingHoursSchema({ monday: open });
    expect(entry).toEqual({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/Monday",
      opens: "09:00",
      closes: "17:00",
    });
  });

  it("omits closed days", () => {
    expect(openingHoursSchema({ sunday: { closed: true } })).toEqual([]);
  });

  // A half-filled row would otherwise emit a spec with a missing time.
  it("omits days missing an open or close time", () => {
    expect(openingHoursSchema({ monday: { closed: false, open: "09:00" } })).toEqual([]);
    expect(openingHoursSchema({ monday: { closed: false, close: "17:00" } })).toEqual([]);
  });

  it("ignores keys that aren't weekdays", () => {
    expect(openingHoursSchema({ someday: open })).toEqual([]);
  });
});

describe("faqSchema", () => {
  it("strips HTML from answers", () => {
    const result = faqSchema([
      { question: "Does it hurt?", answerHtml: "<p>Not <b>much</b>.</p>" },
    ]);
    const answer = (result.mainEntity as { acceptedAnswer: { text: string } }[])[0].acceptedAnswer;
    expect(answer.text).not.toContain("<");
    expect(answer.text).toContain("Not");
  });
});

describe("breadcrumbSchema", () => {
  it("numbers positions from one", () => {
    const result = breadcrumbSchema([
      { name: "Blog", url: "/blog" },
      { name: "Post", url: "/blog/post" },
    ]);
    const items = result.itemListElement as { position: number }[];
    expect(items.map((i) => i.position)).toEqual([1, 2]);
  });
});
