import { describe, expect, it } from "vitest";
import { SETTING_KEYS, analyticsSchema, parseSetting } from "@/features/settings/schemas";

describe("parseSetting", () => {
  // Reads must never throw — a bad row should fall back, not take the site down.
  it("falls back to defaults for a missing row", () => {
    expect(parseSetting("brand", undefined).name).toBe("SmileOn Dental Clinic");
  });

  it("falls back to defaults for a malformed row", () => {
    expect(parseSetting("contact", "not an object").phone).toBe("");
    expect(parseSetting("analytics", { ga4Id: "not-a-ga4-id" }).ga4Id).toBe("");
  });

  it("keeps stored values that are valid", () => {
    expect(parseSetting("brand", { name: "Test Clinic" }).name).toBe("Test Clinic");
  });

  it("fills gaps in a partially stored row", () => {
    const contact = parseSetting("contact", { phone: "+92 300" });
    expect(contact.phone).toBe("+92 300");
    expect(contact.email).toBe("");
  });

  it("has a default for every key", () => {
    for (const key of SETTING_KEYS) {
      expect(() => parseSetting(key, undefined)).not.toThrow();
    }
  });
});

describe("analyticsSchema", () => {
  it("accepts well-formed ids", () => {
    const result = analyticsSchema.parse({
      ga4Id: "G-ABC123",
      gtmId: "GTM-ABC12",
      metaPixelId: "123456",
    });
    expect(result.ga4Id).toBe("G-ABC123");
  });

  it("accepts empty strings so a tag can be turned off", () => {
    expect(analyticsSchema.safeParse({ ga4Id: "", gtmId: "", metaPixelId: "" }).success).toBe(true);
  });

  // A malformed id injects a broken tag into every page.
  it("rejects ids in the wrong format", () => {
    expect(analyticsSchema.safeParse({ ga4Id: "UA-12345" }).success).toBe(false);
    expect(analyticsSchema.safeParse({ gtmId: "ABC12" }).success).toBe(false);
    expect(analyticsSchema.safeParse({ metaPixelId: "abc" }).success).toBe(false);
  });
});
