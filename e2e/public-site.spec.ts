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

  test("the appointment form accepts a booking", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("Test Patient");
    await page.getByLabel("Phone / WhatsApp").fill("03001234567");
    await page.getByRole("button", { name: /request appointment/i }).click();
    await expect(page.getByText(/your request has been received/i)).toBeVisible();
  });
});

test.describe("admin access", () => {
  test("redirects a signed-out visitor to the login page", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("rejects an unauthenticated API write with 401", async ({ request }) => {
    const response = await request.patch("/api/admin/services/does-not-exist", {
      data: { title: "Hacked" },
    });
    expect(response.status()).toBe(401);
  });
});
