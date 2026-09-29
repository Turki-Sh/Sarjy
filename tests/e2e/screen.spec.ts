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

test("Glass goes from solid to clear, live, and is remembered", async ({ page }) => {
  await page.goto("/");
  const liquid = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--liquid").trim());
  expect(await liquid()).toBe("0.6"); // the default
  await openSettings(page, "Appearance");
  const slider = page.getByRole("slider", { name: "Glass" });
  await slider.fill("0");
  expect(await liquid()).toBe("0");
  // Solid: the sidebar is its original solid self, and the light field behind is invisible.
  const ambient = page.locator(".ambient");
  await expect(ambient).toHaveCSS("opacity", "0");
  await page.getByRole("dialog").getByText("Clear", { exact: true }).click();
  expect(await liquid()).toBe("1");
  await expect(ambient).not.toHaveCSS("opacity", "0");
  await page.reload();
  expect(await liquid()).toBe("1");
});
