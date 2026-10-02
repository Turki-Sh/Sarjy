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
  await expect(meta('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/og\/home-shaped-to-its-rider\.png$/,
  );
  // The version it is on, at the foot, linked to its commit (Day 5).
  await expect(page.locator("footer").getByRole("link", { name: /^v0\.7\.\d+$/ })).toHaveAttribute(
    "href",
    /github\.com\/Turki-Sh\/Sarjy\/commit\/[0-9a-f]{7}$/,
  );
  await expect(meta('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(meta('meta[name="theme-color"]')).toHaveCount(2);
  await expect(meta('link[rel="manifest"]')).toHaveCount(1);
  await expect(meta('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

test("preview images, icons and crawler files are served", async ({ request }) => {
  // The home page's card (drawn with the Rafeeqs, Day 5), served as a file like the others.
  const og = await request.get("/og/home-shaped-to-its-rider.png");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");

  for (const path of [
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

test("the voice screen, the film, a missing page and a Majlis link each have their own card (AT-126)", async ({
  page,
  context,
}) => {
  const image = () => page.locator('head meta[property="og:image"]');
  await page.goto("/talk");
  await expect(image()).toHaveAttribute("content", /\/og\/talk-tell-it-once\.png$/);
  // The films as a whole at /film, and each film its own card (and video) at its own link.
  await page.goto("/film");
  await expect(image()).toHaveAttribute("content", /\/og\/films-sarjy-films\.png$/);
  await page.goto("/film/end-of-winter");
  await expect(image()).toHaveAttribute("content", /\/og\/film-end-of-winter\.png$/);
  await expect(page.locator('head meta[property="og:video"]')).toHaveAttribute(
    "content",
    /\/video\/end-of-winter-1080\.mp4$/,
  );
  await page.goto("/film/sarjy-in-a-minute");
  await expect(image()).toHaveAttribute("content", /\/og\/film-sarjy-in-a-minute\.png$/);
  await page.goto("/no-such-page");
  await expect(image()).toHaveAttribute("content", /\/og\/lost-not-a-real-page\.png$/);
  await page.goto("/majlis/ZZZZZ");
  await expect(image()).toHaveAttribute("content", /\/og\/majlis-pull-up-a-cushion\.png$/);

  // In Arabic, the Arabic cards.
  await context.addCookies([{ name: "sarjy_lang", value: "ar", url: "http://localhost:3100" }]);
  await page.goto("/talk");
  await expect(image()).toHaveAttribute("content", /\/og\/talk-qulha-marra\.png$/);
  await page.goto("/film");
  await expect(image()).toHaveAttribute("content", /\/og\/films-aflam-sarjy\.png$/);
  await page.goto("/film/end-of-winter");
  await expect(image()).toHaveAttribute("content", /\/og\/film-akhir-alshita\.png$/);
  await page.goto("/film/sarjy-in-a-minute");
  await expect(image()).toHaveAttribute("content", /\/og\/film-sarjy-fi-daqiqa\.png$/);
  await page.goto("/no-such-page");
  await expect(image()).toHaveAttribute("content", /\/og\/lost-mo-mawjouda\.png$/);
  await page.goto("/majlis/ZZZZZ");
  await expect(image()).toHaveAttribute("content", /\/og\/majlis-hayyak\.png$/);
});

test("a link-preview bot gets the 404 card with a 200, so the card shows; people still get a 404 (AT-126)", async ({
  request,
}) => {
  expect((await request.get("/no-such-page")).status()).toBe(404);
  for (const ua of [
    "WhatsApp/2.24.1 A",
    "Mozilla/5.0 (compatible; Discordbot/2.0)",
    "facebookexternalhit/1.1",
  ]) {
    const res = await request.get("/no-such-page", { headers: { "user-agent": ua } });
    expect(res.status(), ua).toBe(200);
    expect(await res.text()).toMatch(/og:image" content="[^"]+\/og\/lost-not-a-real-page\.png"/);
  }
  // Search engines are not preview bots: still a 404.
  const google = await request.get("/no-such-page", { headers: { "user-agent": "Googlebot/2.1" } });
  expect(google.status()).toBe(404);
});
