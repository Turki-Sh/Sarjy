import { expect, test } from "@playwright/test";

// Shared moments and link previews per link: the card follows what the link is about.

test("shares a weather answer; the link shows the exchange and a weather card", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill("What's the weather in Riyadh tomorrow?");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "idle", {
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "Share this moment" }).click();
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

test("the build notes are served at /notes with their own card", async ({ page }) => {
  await page.goto("/notes");
  await expect(page).toHaveTitle(/Product Documents/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /notes-from-building\.png$/,
  );
  await expect(page.getByRole("heading", { name: "Architecture", level: 1 })).toBeVisible();
});
