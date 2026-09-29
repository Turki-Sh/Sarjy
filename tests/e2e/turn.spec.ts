import { expect, test, type Page } from "@playwright/test";

// Typed turns through the real pipeline with fake providers (no keys, no network).
// Acceptance tests AT-04 (text works), AT-10, AT-11, AT-30, AT-40, AT-44.

const say = async (page: Page, text: string) => {
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill(text);
  await page.keyboard.press("Enter");
};
const screen = (page: Page) => page.locator("[data-state]").first();
/** The caption under the orb (not the screen-reader copy of it). */
const caption = (page: Page) => page.locator("main section p[lang]");

test("saves a fact, stitches it, and remembers it after a reload", async ({ page }) => {
  await page.goto("/");
  await say(page, "My favorite color is green.");

  await expect(screen(page)).toHaveAttribute("data-state", /thinking|tool|speaking/);
  await expect(screen(page)).toHaveAttribute("data-state", "saving", { timeout: 10_000 });
  const sidebar = page.getByRole("complementary");
  await expect(sidebar.getByText("Favorite color", { exact: true })).toBeVisible();
  await expect(sidebar.getByText("Green", { exact: true })).toBeVisible();
  await expect(page.locator("p[lang] span[class*=keep]")).toHaveText(/favorite color is green/i);
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 5_000 });

  await page.reload();
  await expect(page.getByRole("complementary").getByText("Green", { exact: true })).toBeVisible();
  await say(page, "What's my favorite color?");
  await expect(caption(page)).toHaveText("Green. You told me today.", { timeout: 10_000 });
});

test("checks the weather with a timed tool chip", async ({ page }) => {
  await page.goto("/");
  await say(page, "What's the weather in Riyadh tomorrow?");
  await expect(page.getByText('weather.forecast("Riyadh", "tomorrow")')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/\d+ ms/)).toBeVisible();
  await expect(caption(page)).toHaveText(/high of 41/, { timeout: 10_000 });
});
