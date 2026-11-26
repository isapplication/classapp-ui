/**
 * School selector (/login) and school sign-in (/{slug}/login).
 * Mocks GET /public/tenants and POST /admin/tenant-login.
 */

import { test, expect } from "@playwright/test";
import {
  blockUnmockedApi,
  mockTenantList,
  mockTenantBranding,
  mockSchoolLogin,
  TENANT,
} from "../../fixtures/mocks";

test.describe("school selector (/login)", () => {
  test.beforeEach(async ({ page }) => {
    await blockUnmockedApi(page);
    await mockTenantList(page);
    await page.goto("/login");
  });

  test("shows Verto logo and school search input", async ({ page }) => {
    await expect(page.getByText("Verto").first()).toBeVisible();
    await expect(page.getByPlaceholder(/oakridge international/i)).toBeVisible();
  });

  test("lists schools matching search query", async ({ page }) => {
    await page.getByPlaceholder(/oakridge international/i).fill("test");
    await expect(page.getByText(TENANT.name)).toBeVisible();
  });

  test("enables Continue button after selecting a school", async ({ page }) => {
    await page.getByPlaceholder(/oakridge international/i).fill("Test");
    await page.getByText(TENANT.name).click();
    const btn = page.getByRole("button", { name: /continue to sign in/i });
    await expect(btn).toBeEnabled();
  });

  test("redirects to /{slug}/login on continue", async ({ page }) => {
    await page.getByPlaceholder(/oakridge international/i).fill("Test");
    await page.getByText(TENANT.name).click();
    await page.getByRole("button", { name: /continue to sign in/i }).click();
    await expect(page).toHaveURL(`/${TENANT.slug}/login`);
  });
});

test.describe("school sign-in (/{slug}/login)", () => {
  test.beforeEach(async ({ page }) => {
    await blockUnmockedApi(page);
    await mockTenantBranding(page);
    await mockSchoolLogin(page);
    await page.goto(`/${TENANT.slug}/login`);
  });

  test("shows Verto logo when school has no custom logo", async ({ page }) => {
    await expect(page.getByText("Verto").first()).toBeVisible();
  });

  test("shows tenant name after branding loads", async ({ page }) => {
    await expect(page.getByText(TENANT.name)).toBeVisible({ timeout: 10_000 });
  });

  test("sign in button is disabled while fields are empty", async ({ page }) => {
    const btn = page.getByRole("button", { name: /sign in to dashboard/i });
    await expect(btn).toBeDisabled();
  });

  test("sign in button enables when both fields are filled", async ({ page }) => {
    await page.getByLabel(/email address/i).fill("admin@test.edu");
    await page.getByLabel(/password/i).fill("secret123");
    await expect(
      page.getByRole("button", { name: /sign in to dashboard/i }),
    ).toBeEnabled();
  });

  test("redirects to /admin on successful sign-in", async ({ page }) => {
    await page.getByLabel(/email address/i).fill("admin@test.edu");
    await page.getByLabel(/password/i).fill("secret123");
    await page.getByRole("button", { name: /sign in to dashboard/i }).click();
    await expect(page).toHaveURL("/admin", { timeout: 10_000 });
  });

  test("shows error on bad credentials", async ({ page }) => {
    await page.route("**/admin/tenant-login", (route) =>
      route.fulfill({
        status: 401,
        json: { code: "invalid_credentials", message: "Bad credentials" },
      }),
    );
    await page.getByLabel(/email address/i).fill("admin@test.edu");
    await page.getByLabel(/password/i).fill("wrong");
    await page.getByRole("button", { name: /sign in to dashboard/i }).click();
    await expect(
      page.getByText(/the email or password is incorrect/i),
    ).toBeVisible();
  });
});
