import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("home page renders the seeded content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /book an appointment/i }).first()).toBeVisible();
  });

  test("treatments list links through to a detail page", async ({ page }) => {
    await page.goto("/services");
    const firstService = page.locator("a[href^='/services/']").first();
    await expect(firstService).toBeVisible();
    await firstService.click();
    await expect(page).toHaveURL(/\/services\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  // Every content type the CMS manages needs somewhere to appear, or editors
  // are publishing into a void.
  for (const [path, heading] of [
    ["/team", /our team/i],
    ["/gallery", /before/i],
    ["/blog", /blog/i],
    ["/faqs", /frequently asked/i],
  ] as const) {
    test(`${path} renders`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });
  }

  test("the appointment form accepts a booking", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("Test Patient");
    await page.getByLabel("Phone / WhatsApp").fill("03001234567");
    await page.getByRole("button", { name: /request appointment/i }).click();
    await expect(page.getByText(/your request has been received/i)).toBeVisible();
  });

  test("an unknown path returns the 404 page, not a crash", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-real-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /couldn.t find that page/i })).toBeVisible();
  });

  test("robots.txt and sitemap.xml are served", async ({ request }) => {
    expect((await request.get("/robots.txt")).status()).toBe(200);

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("<urlset");
  });
});

test.describe("admin access", () => {
  test("redirects a signed-out visitor to the login page", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("the login page offers a password reset", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot it/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();
  });

  test("a reset request never reveals whether the account exists", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("definitely-not-a-user@example.com");
    await page.getByRole("button", { name: /email me a reset link/i }).click();
    // Same confirmation an existing address gets — no enumeration oracle.
    await expect(page.getByText(/check your inbox/i)).toBeVisible();
  });

  test("an invalid invite token shows a dead-link message, not a form", async ({ page }) => {
    await page.goto("/invite/not-a-real-token");
    await expect(page.getByText(/no longer valid/i)).toBeVisible();
    await expect(page.getByLabel("Choose a password")).toHaveCount(0);
  });

  test("rejects an unauthenticated API write with 401", async ({ request }) => {
    const response = await request.patch("/api/admin/services/does-not-exist", {
      data: { title: "Hacked" },
    });
    expect(response.status()).toBe(401);
  });

  test("rejects an unauthenticated read of the audit log", async ({ request }) => {
    expect((await request.get("/api/admin/audit")).status()).toBe(401);
  });

  test("the audit log has no write endpoints", async ({ request }) => {
    // 405 (or 401 before routing) — anything but a success. An audit trail
    // that can be mutated over HTTP is not a trail.
    for (const method of ["post", "patch", "delete"] as const) {
      const response = await request[method]("/api/admin/audit");
      expect(response.ok()).toBe(false);
    }
  });
});
