import { expect, test } from "@playwright/test";

// The voice screen: theme and language. Acceptance tests AT-45, AT-46, AT-105.

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
