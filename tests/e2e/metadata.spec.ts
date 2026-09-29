import { expect, test } from "@playwright/test";

// Link previews, icons and install metadata. Acceptance tests AT-100, AT-101, AT-103.

test("the page head carries complete metadata", async ({ page }) => {
  await page.goto("/");
  const meta = (sel: string) => page.locator(`head ${sel}`);
  await expect(page).toHaveTitle(/Sarjy/);
  await expect(meta('meta[name="description"]')).toHaveCount(1);
  await expect(meta('link[rel="canonical"]')).toHaveCount(1);
  for (const p of ["og:title", "og:description", "og:image", "og:locale", "og:locale:alternate", "og:type"]) {
    await expect(meta(`meta[property="${p}"]`)).toHaveCount(1);
  }
  await expect(meta('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
  await expect(meta('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(meta('meta[name="theme-color"]')).toHaveCount(2);
  await expect(meta('link[rel="manifest"]')).toHaveCount(1);
  await expect(meta('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

test("preview images, icons and crawler files are served", async ({ request }) => {
  const og = await request.get("/opengraph-image");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");

  for (const path of [
    "/twitter-image",
    "/icon.svg",
    "/favicon.ico",
    "/apple-icon.png",
    "/icons/icon-512.png",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }

  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
});

test("health reports configuration as booleans only", async ({ request }) => {
  const health = await (await request.get("/api/health")).json();
  for (const [key, value] of Object.entries(health)) {
    if (key !== "providers") expect(typeof value, key).toBe("boolean");
  }
});
