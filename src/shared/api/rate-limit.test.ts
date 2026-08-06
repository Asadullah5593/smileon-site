import { beforeEach, describe, expect, it } from "vitest";
import { clientKey, rateLimit, resetRateLimits } from "@/shared/api/rate-limit";
import { RateLimitError } from "@/shared/api/errors";

describe("rateLimit", () => {
  beforeEach(resetRateLimits);

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i += 1) expect(() => rateLimit("test", 3)).not.toThrow();
  });

  it("throws once the limit is exceeded", () => {
    for (let i = 0; i < 3; i += 1) rateLimit("test", 3);
    expect(() => rateLimit("test", 3)).toThrow(RateLimitError);
  });

  it("keeps separate buckets per key", () => {
    rateLimit("a", 1);
    expect(() => rateLimit("b", 1)).not.toThrow();
  });
});

describe("clientKey", () => {
  it("uses the first x-forwarded-for entry", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientKey(req, "contact")).toBe("contact:1.2.3.4");
  });

  it("falls back to `unknown` without proxy headers", () => {
    expect(clientKey(new Request("http://x"), "contact")).toBe("contact:unknown");
  });
});
