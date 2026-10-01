import { expect, test } from "@playwright/test";

// Shared moments and link previews per link: the card follows what the link is about.

test("shares a weather answer; the link shows the exchange and a weather card", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/talk");
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill("What's the weather in Riyadh tomorrow?");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "idle", {
    timeout: 15_000,
  });

  // Share lives in the chat's ⋯ menu in Recent.
  await page.getByRole("button", { name: "More options: What's the weather in Riyadh tomorrow?" }).click();
  await page.getByRole("menuitem", { name: "Share" }).click();
  await expect(page.getByRole("status")).toHaveText("Link copied");
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toMatch(/\/s\/[a-z0-9]{12}$/);

  await page.goto(url);
  await expect(page.getByText("What's the weather in Riyadh tomorrow?")).toBeVisible();
  await expect(page.getByText(/high of 41/)).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/og\/tomorrow-at-a-glance\.png$/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("an unknown shared link is a 404", async ({ request }) => {
  expect((await request.get("/s/aaaaaaaaaaaa")).status()).toBe(404);
});

test("the Sarjy Handbook is locked: a 404 without the key, open with it, and /notes forwards to it", async ({
  page,
  request,
}) => {
  // HANDBOOK_KEY is set for the test server in playwright.config.ts.
  expect((await request.get("/handbook", { maxRedirects: 0 })).status()).toBe(404);
  expect((await request.get("/handbook?key=not-the-right-key-at-all", { maxRedirects: 0 })).status()).toBe(
    404,
  );
  expect((await request.get("/handbook", { headers: { cookie: "sarjy_handbook=guess" } })).status()).toBe(
    404,
  );

  // The key once, then the address is cleaned and a cookie keeps it open.
  await page.goto("/notes?key=e2e-handbook-key-0123456789"); // gitleaks:allow
  await expect(page).toHaveURL(/\/handbook$/);
  await expect(page).toHaveTitle("Sarjy Handbook");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /notes-from-building\.png$/,
  );
  await expect(page.getByRole("heading", { name: "Architecture", level: 1 })).toBeVisible();
  await page.goto("/handbook");
  await expect(page).toHaveTitle("Sarjy Handbook");
});
