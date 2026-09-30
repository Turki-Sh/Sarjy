import { expect, test } from "@playwright/test";

// No microphone access: the mic turns dashed, the text box takes focus, and a note says why.
// Acceptance test AT-04 (no mic, or permission denied).

test("without mic access, typing takes over", async ({ page }) => {
  await page.goto("/talk");
  await page.getByRole("button", { name: "Talk to Sarjy" }).click();

  await expect(page.locator('button[data-look="blocked"]')).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Type to Sarjy…" })).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "No mic access" })).toBeVisible();
  await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "idle");
});
