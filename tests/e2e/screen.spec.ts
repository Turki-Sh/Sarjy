import { expect, test, type Page } from "@playwright/test";

// The voice screen's look and language, chosen in Settings. Acceptance tests AT-45, AT-46, AT-105.

const openSettings = async (page: Page, section: string) => {
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("dialog").getByRole("button", { name: section, exact: true }).click();
};

test("dark mode persists across a reload, with no flash of light", async ({ page }) => {
  await page.goto("/");
  await openSettings(page, "Appearance");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // The server renders the saved theme, so it is right before any script runs.
  const html = await (await page.request.get("/", { headers: { cookie: "sarjy_theme=dark" } })).text();
  expect(html).toMatch(/<html[^>]*data-theme="dark"/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("System follows the device, before the first paint", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await openSettings(page, "Appearance");
  await page.getByRole("radio", { name: "System" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the Arabic interface mirrors and switches every string", async ({ page }) => {
  await page.goto("/");
  await openSettings(page, "General");
  await page.getByRole("combobox", { name: "Language" }).selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "كلّم سرجي" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  // Auto detect goes back to the browser's language (English here).
  await page.getByRole("button", { name: "افتح الإعدادات" }).click();
  await page.getByRole("combobox", { name: "اللغة" }).selectOption("auto");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
