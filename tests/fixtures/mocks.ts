import type { Page } from "@playwright/test";

const API = "http://localhost:8000";

export const TENANT = {
  name: "Test School",
  slug: "test-school",
  branding: { primaryColor: "#7C3AED", logoUrl: null },
};

export const LAUNCH_RESULT = {
  meetingUrl: "https://teams.microsoft.com/meet/3105712756500610?p=test",
  meetingTitle: "Demo Class",
  tenant: {
    name: TENANT.name,
    branding: { primaryColor: "#7C3AED", faviconUrl: null },
  },
};

/** Mock GET /public/tenants — returns a list with one test school. */
export async function mockTenantList(page: Page) {
  await page.route(`${API}/public/tenants`, (route) =>
    route.fulfill({ json: [TENANT] }),
  );
}

/** Mock GET /public/tenants/:slug — returns single tenant branding. */
export async function mockTenantBranding(page: Page, slug = TENANT.slug) {
  await page.route(`${API}/public/tenants/${slug}`, (route) =>
    route.fulfill({ json: TENANT }),
  );
}

/** Mock POST /admin/tenant-login for school admin. */
export async function mockSchoolLogin(page: Page) {
  await page.route(`${API}/admin/tenant-login`, (route) =>
    route.fulfill({ json: { token: "test-token-school" } }),
  );
}

/** Mock POST /admin/login for platform admin. */
export async function mockPlatformLogin(page: Page) {
  await page.route(`${API}/admin/login`, (route) =>
    route.fulfill({
      json: {
        token: "test-token-platform",
        username: "admin",
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      },
    }),
  );
}

/** Mock POST /api/launch — returns a valid launch result for join-flow. */
export async function mockLaunchToken(page: Page) {
  await page.route(`${API}/api/launch`, (route) =>
    route.fulfill({ json: LAUNCH_RESULT }),
  );
}

/** Catch-all: block unmatched API calls so tests don't silently hit a real server. */
export async function blockUnmockedApi(page: Page) {
  await page.route(`${API}/**`, (route) => {
    console.warn(`[test] unmocked: ${route.request().url()}`);
    route.fulfill({ status: 404, json: { error: "not_mocked" } });
  });
}
