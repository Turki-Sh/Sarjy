import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Settings: a popup over the voice screen, like Claude's. Profile picture (a painting or your own
// photo), your name, and every memory with Edit, Forget and Forget everything.

const photo = fileURLToPath(new URL("../../public/icons/icon-512.png", import.meta.url));

const say = async (page: Page, text: string) => {
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill(text);
  await page.keyboard.press("Enter");
};
const settings = (page: Page) => page.getByRole("dialog");
const open = async (page: Page, section: string) => {
  await page.getByRole("button", { name: "Open settings" }).click();
  await settings(page).getByRole("button", { name: section, exact: true }).click();
};
const myPicture = (page: Page) => page.getByRole("button", { name: "Open settings" }).locator("img");

test("opens as a popup and closes with Escape or the close button", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(settings(page)).toBeVisible();
  await expect(settings(page).getByRole("heading", { name: "General" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(settings(page)).toBeHidden();
  await page.getByRole("button", { name: "Open settings" }).click();
  await settings(page).getByRole("button", { name: "Close settings" }).click();
  await expect(settings(page)).toBeHidden();
});

test("your picture: one of the paintings, or a photo from your computer", async ({ page }) => {
  await page.goto("/");
  await expect(myPicture(page)).toHaveAttribute("src", /\/avatars\/(rider-at-rest|falconer|the-ride)\.webp/);
  await open(page, "Profile");
  await settings(page).getByRole("radio", { name: "The falconer" }).click();
  await expect(myPicture(page)).toHaveAttribute("src", "/avatars/falconer.webp");

  await settings(page).locator('input[type="file"]').setInputFiles(photo);
  await expect(myPicture(page)).toHaveAttribute("src", /^data:image\/(webp|jpeg);base64,/);
  await page.reload();
  await expect(myPicture(page)).toHaveAttribute("src", /^data:image\/(webp|jpeg);base64,/);
});

test("your name, and your memories: edit, forget, forget everything", async ({ page }) => {
  await page.goto("/");
  await open(page, "Profile");
  await settings(page).getByRole("textbox", { name: "Your name" }).fill("Turki");
  await settings(page).getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Open settings" })).toContainText("Turki");
  await page.keyboard.press("Escape");

  await say(page, "My favorite color is green.");
  await expect(page.getByRole("button", { name: /^Saved: Favorite color, Green/ })).toBeVisible({
    timeout: 15_000,
  });

  await open(page, "Memory");
  const memory = settings(page);
  await expect(memory.getByText("Turki", { exact: true })).toBeVisible();
  // Edit the color.
  await memory.getByRole("button", { name: "Edit Favorite color" }).click();
  await memory.getByRole("textbox", { name: "Favorite color" }).fill("Blue");
  await memory.getByRole("button", { name: "Save" }).click();
  await expect(memory.getByText("Blue", { exact: true })).toBeVisible();
  // Forget it.
  await memory.getByRole("button", { name: "Forget Favorite color" }).click();
  await expect(memory.getByText("Blue", { exact: true })).toHaveCount(0);

  // Forget everything asks once, then starts over as a stranger.
  await memory.getByRole("button", { name: "Forget everything" }).click();
  await memory.getByRole("button", { name: "Yes, forget everything" }).click();
  await page.waitForLoadState("load");
  await open(page, "Memory");
  await expect(settings(page).getByText("Nothing yet. Tell Sarjy something about you.")).toBeVisible();
});

test("memory lives in Settings: the sidebar has one row that opens it, and the saved card does too", async ({
  page,
}) => {
  await page.goto("/");
  const side = page.getByRole("complementary");
  await say(page, "My favorite color is green.");
  const card = page.getByRole("button", { name: /^Saved: Favorite color, Green/ });
  await expect(card).toBeVisible({ timeout: 15_000 });
  // No list of facts in the sidebar, only the way in.
  await expect(side.getByText("Green", { exact: true })).toHaveCount(0);
  await card.click();
  await expect(settings(page).getByRole("heading", { name: "Memory" })).toBeVisible();
  await expect(settings(page).getByText("Green", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await side.getByRole("button", { name: /Memory/ }).click();
  await expect(settings(page).getByRole("heading", { name: "Memory" })).toBeVisible();
});

// Settings, Appearance, Background (Turki's direction, Day 2): the light field, a rug, or your own
// picture, remembered, and your own served only to you.
test("pick a rug or your own picture as the background, and keep it", async ({ page, browser }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Appearance", exact: true }).click();
  const layer = page.locator("[data-wallpaper]");
  await expect(layer).toHaveCount(0); // the light field by default

  await page.getByRole("radio", { name: "Crimson" }).click();
  await expect(layer).toHaveAttribute("data-wallpaper", "crimson");
  await expect(layer).toHaveCSS("background-image", /\/wallpapers\/crimson\.jpg/);
  await page.reload();
  await expect(layer).toHaveAttribute("data-wallpaper", "crimson");

  // Your own: shrunk in the browser, uploaded, chosen, and a new choice in the picker.
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("dialog").locator('input[type="file"]').setInputFiles("public/wallpapers/sunlit.jpg");
  await expect(layer).toHaveAttribute("data-wallpaper", /^own-\d+$/);
  await expect(page.getByRole("radio", { name: "Your picture" })).toHaveAttribute("aria-checked", "true");
  const url = (await layer.getAttribute("style"))!.match(/url\("([^"]+)"\)/)![1]!;
  const mine = await page.request.get(url);
  expect(mine.status()).toBe(200);
  expect(mine.headers()["content-type"]).toBe("image/jpeg");

  // Someone else (another browser, another anonymous user) gets nothing.
  const stranger = await browser.newContext();
  expect((await stranger.request.get(new URL(url, page.url()).toString())).status()).toBe(404);
  await stranger.close();

  // Back to the glow.
  await page.getByRole("radio", { name: "Glow" }).click();
  await expect(layer).toHaveCount(0);
  await expect(page.locator(".ambient")).toHaveCount(1);
});

test("at Pure, the page behind Settings is not frosted or dimmed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Appearance", exact: true }).click();
  const backdrop = () =>
    page.locator("dialog").evaluate((d) => {
      const b = getComputedStyle(d, "::backdrop");
      return { filter: b.backdropFilter, background: b.backgroundColor };
    });
  expect((await backdrop()).filter).not.toBe("blur(0px)");
  await page.getByRole("dialog").getByText("Pure", { exact: true }).click();
  const pure = await backdrop();
  expect(pure.filter).toBe("blur(0px)");
  expect(pure.background).toMatch(/[,/] 0\)$|transparent/); // alpha 0, in whichever notation
});
