/**
 * Platform admin sign-in (/admin).
 * AdminApp renders SignIn when no session is found.
 * Mocks POST /admin/login.
 */

import { test, expect } from "@playwright/test";
import { blockUnmockedApi, mockPlatformLogin } from "../../fixtures/mocks";

test.describe("platform admin sign-in (/admin)", () => {
  test.beforeEach(async ({ page }) => {
    await blockUnmockedApi(page);
    await mockPlatformLogin(page);
    await page.addInitScript(() => sessionStorage.clear());
    await page.goto("/admin");
  });

  test("shows Verto logo and admin console heading", async ({ page }) => {
    await expect(page.getByText("Verto").first()).toBeVisible();
    await expect(page.getByText(/admin console/i)).toBeVisible();
  });

  test("sign in button disabled while fields are empty", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /^sign in$/i }),
    ).toBeDisabled();
  });

  test("sign in button enables when credentials are filled", async ({ page }) => {
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill("pass");
    await expect(
      page.getByRole("button", { name: /^sign in$/i }),
    ).toBeEnabled();
  });

  test("shows dashboard after successful sign-in", async ({ page }) => {
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill("pass");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.getByText(/overview/i)).toBeVisible({ timeout: 10_000 });
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.route("**/admin/login", (route) =>
      route.fulfill({
        status: 401,
        json: { code: "invalid_credentials", message: "Bad credentials" },
      }),
    );
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/password/i).fill("wrong");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(
      page.getByText(/the username or password is incorrect/i),
    ).toBeVisible();
  });
});
