/**
 * Integration spec for @silverassist/trusted-form consumed by a real Next
 * app. The fixture installs the *packed tarball*, so this runs against
 * exactly what npm would publish -- the point is proving the "use client"
 * directive survives the build, which no unit test can see.
 */
import { expect, test } from "@playwright/test";

test("renders inside a Server Component page without a client-boundary error", async ({ page }) => {
  await page.goto("/");
  // Were the "use client" directive missing from the built file, the page
  // would have failed to prerender and never reached the browser at all.
  await expect(page.locator("h1")).toHaveText("trusted-form fixture");
});

test("renders the noscript fallback pixel markup", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  expect(html).toContain("api.trustedform.com/ns.gif");
});
