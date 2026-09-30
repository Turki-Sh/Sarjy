import { expect, test, type Page } from "@playwright/test";

// The voice screen's look and language, chosen in Settings. Acceptance tests AT-45, AT-46, AT-105.

const openSettings = async (page: Page, section: string) => {
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("dialog").getByRole("button", { name: section, exact: true }).click();
};

test("dark mode persists across a reload, with no flash of light", async ({ page }) => {
  await page.goto("/talk");
  await openSettings(page, "Appearance");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // The server renders the saved theme, so it is right before any script runs.
  const html = await (await page.request.get("/talk", { headers: { cookie: "sarjy_theme=dark" } })).text();
  expect(html).toMatch(/<html[^>]*data-theme="dark"/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("System follows the device, before the first paint", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/talk");
  await openSettings(page, "Appearance");
  await page.getByRole("radio", { name: "System" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the Arabic interface mirrors and switches every string", async ({ page }) => {
  await page.goto("/talk");
  await openSettings(page, "General");
  // The language menu is Sarjy's own dropdown: a button, then a list with a check on the choice.
  await page.getByRole("button", { name: /^Language:/ }).click();
  // Nothing chosen yet: Auto detect is the current choice.
  await expect(page.getByRole("option", { name: "Auto detect" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("option", { name: "العربية" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "كلّم سرجي" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  // Auto detect goes back to the browser's language (English here).
  await page.getByRole("button", { name: "افتح الإعدادات" }).click();
  await page.getByRole("button", { name: /^اللغة:/ }).click();
  await page.getByRole("option", { name: "تلقائي" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("Glass goes from solid to clear, live, and is remembered", async ({ page }) => {
  await page.goto("/talk");
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
  // Clear looks as it always did: the sidebar keeps a trace of tint (18%) and some frosting.
  const sidebar = page.getByRole("complementary");
  const alpha = () =>
    sidebar.evaluate((el) => Number(getComputedStyle(el).backgroundColor.match(/[\d.]+(?=\))/)?.[0] ?? 1));
  expect(await alpha()).toBeCloseTo(0.18, 2);
  await expect(sidebar).toHaveCSS("backdrop-filter", /blur\(6px\)/);

  // Past Clear, Pure (Turki's direction, Day 2): no tint and no frosting at all, only the edge.
  await page.getByRole("dialog").getByText("Pure", { exact: true }).click();
  expect(await liquid()).toBe("1.5");
  expect(await alpha()).toBe(0);
  await expect(sidebar).toHaveCSS("backdrop-filter", /blur\(0px\)/);
  await page.reload();
  expect(await liquid()).toBe("1.5");
});

test("the language menu works from the keyboard, and Escape closes only the menu", async ({ page }) => {
  await page.goto("/talk");
  await openSettings(page, "General");
  await page.getByRole("button", { name: /^Language:/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox", { name: "Language" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("a device that asks for less transparency starts Solid, but your own choice wins", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
  });
  await page.goto("/talk");
  const ambient = page.locator(".ambient");
  await expect(ambient).toHaveCSS("opacity", "0");
  await openSettings(page, "Appearance");
  await expect(page.getByText(/Your device asks for less transparency/)).toBeVisible();
  await page.getByRole("dialog").getByText("Clear", { exact: true }).click();
  await expect(ambient).not.toHaveCSS("opacity", "0");
  await page.reload();
  await expect(ambient).not.toHaveCSS("opacity", "0");
});
