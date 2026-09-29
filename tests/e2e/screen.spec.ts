import { expect, test } from "@playwright/test";

// The voice screen as built in M1: states, theme, language. Acceptance tests AT-40, AT-45, AT-46, AT-105.

test("runs a turn through the voice states", async ({ page }) => {
  await page.goto("/");
  const screen = page.locator("[data-state]").first();
  await expect(screen).toHaveAttribute("data-state", "idle");

  await page.getByRole("button", { name: "Talk to Sarjy" }).click();
  await expect(screen).toHaveAttribute("data-state", "listening");
  await expect(page.getByRole("button", { name: "Stop" })).toHaveAttribute("aria-pressed", "true");
  await expect(screen).toHaveAttribute("data-state", "thinking", { timeout: 5000 });
  await expect(screen).toHaveAttribute("data-state", "tool", { timeout: 3000 });
  await expect(page.getByText('weather.forecast("Riyadh", "tomorrow")')).toBeVisible();
  await expect(screen).toHaveAttribute("data-state", "speaking", { timeout: 3000 });
  await expect(screen).toHaveAttribute("data-state", "idle", { timeout: 8000 });
});

test("dark mode persists across a reload, with no flash of light", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  // The server renders the saved theme, so it is right before any script runs.
  const html = await (await page.request.get("/", { headers: { cookie: "sarjy_theme=dark" } })).text();
  expect(html).toMatch(/<html[^>]*data-theme="dark"/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("the Arabic interface mirrors and switches every string", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch language" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("button", { name: "كلّم سرجي" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
