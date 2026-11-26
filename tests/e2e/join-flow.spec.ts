/**
 * Join flow — the core student/teacher entry point.
 * Covers: valid token → consent screen, bad/missing token → error screen,
 * and the token-in-hash-fragment path.
 *
 * Uses page.route() to mock POST /api/launch — no real backend needed.
 */

import { test, expect } from "@playwright/test";
import {
  blockUnmockedApi,
  mockLaunchToken,
  LAUNCH_RESULT,
} from "../fixtures/mocks";

const JOIN = "/join"; // the join page route

test.describe("valid token", () => {
  test.beforeEach(async ({ page }) => {
    await blockUnmockedApi(page);
    await mockLaunchToken(page);
  });

  test("shows preparing state then consent screen", async ({ page }) => {
    await page.goto(`${JOIN}?token=tok_valid`);

    // transient preparing state
    await expect(page.getByText(/preparing your class/i)).toBeVisible();

    // consent card appears once the API resolves
    await expect(page.getByText(LAUNCH_RESULT.meetingTitle)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("displays tenant name on consent screen", async ({ page }) => {
    await page.goto(`${JOIN}?token=tok_valid`);
    await expect(
      page.getByText(LAUNCH_RESULT.tenant.name),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("strips token from address bar after redeeming", async ({ page }) => {
    await page.goto(`${JOIN}?token=tok_valid`);
    // JoinFlow calls replaceState immediately — URL should drop the token
    await expect(page).toHaveURL(JOIN, { timeout: 5_000 });
  });
});

test.describe("invalid / missing token", () => {
  test.beforeEach(async ({ page }) => {
    // no mockLaunchToken → blockUnmockedApi returns 404 for /api/launch
    await blockUnmockedApi(page);
  });

  test("shows error when token is missing", async ({ page }) => {
    await page.goto(JOIN);
    await expect(
      page.getByText(/this link is incomplete/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("shows error when token is invalid/expired", async ({ page }) => {
    await page.goto(`${JOIN}?token=bad_tok`);
    await expect(
      page.getByText(/this link isn't valid/i),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("token in URL hash fragment", () => {
  test.beforeEach(async ({ page }) => {
    await blockUnmockedApi(page);
    await mockLaunchToken(page);
  });

  test("reads token from hash and strips it from address bar", async ({ page }) => {
    await page.goto(`${JOIN}#token=tok_hash`);
    await expect(page).toHaveURL(JOIN, { timeout: 5_000 });
    await expect(page.getByText(LAUNCH_RESULT.meetingTitle)).toBeVisible({
      timeout: 15_000,
    });
  });
});
