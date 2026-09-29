import { expect, test, type Page } from "@playwright/test";

// Moving between chats should be felt: New chat clears the stage and says so, a past chat reopens
// with its last answer, search filters as you type, and the sidebar folds away and comes back.

const say = async (page: Page, text: string) => {
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill(text);
  await page.keyboard.press("Enter");
};
const screen = (page: Page) => page.locator("[data-state]").first();
const caption = (page: Page) => page.locator("main section p[lang]");
const sidebar = (page: Page) => page.getByRole("complementary");

test("new chat, reopening a past chat, and search", async ({ page }) => {
  await page.goto("/");
  await say(page, "My favorite food is kabsa.");
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 15_000 });

  // The chat now shows in Recent, marked as the one on screen; New chat is not.
  const chat = sidebar(page).getByRole("button", { name: "My favorite food is kabsa." });
  await expect(chat).toHaveAttribute("aria-current", "page");
  await expect(sidebar(page).getByRole("button", { name: "New chat" })).not.toHaveAttribute("aria-current");

  await sidebar(page).getByRole("button", { name: "New chat" }).click();
  await expect(page.getByText("A new chat. What's on your mind?")).toBeVisible();
  await expect(caption(page)).toHaveCount(0);
  await expect(sidebar(page).getByRole("button", { name: "New chat" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await chat.click();
  await expect(page.getByText("Picking up where you left off")).toBeVisible();
  await expect(caption(page)).toHaveText(/kabsa/i);
  await expect(chat).toHaveAttribute("aria-current", "page");

  // Search filters memories and chats as you type.
  const search = sidebar(page).getByRole("searchbox", { name: "Search" });
  await search.fill("kabsa");
  await expect(sidebar(page).getByText("Kabsa", { exact: true })).toBeVisible();
  await search.fill("pizza");
  await expect(sidebar(page).getByText("Nothing matches").first()).toBeVisible();
  await expect(chat).toHaveCount(0);
});

test("the sidebar closes, stays closed after a reload, and reopens", async ({ page }) => {
  await page.goto("/");
  await sidebar(page).getByRole("button", { name: "Close sidebar" }).click();
  await expect(sidebar(page)).toHaveCount(0);
  await page.reload();
  await expect(sidebar(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Open sidebar" }).click();
  await expect(sidebar(page)).toBeVisible();
});

test("the control bar only shows what works: End appears only during a turn", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "End", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /voice settings/i })).toHaveCount(0);
  await say(page, "What's the weather in Riyadh tomorrow?");
  await expect(page.getByRole("button", { name: "End", exact: true })).toBeVisible();
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "End", exact: true })).toHaveCount(0);
});

test("your picture is one of the three paintings, and you can choose another", async ({ page }) => {
  await page.goto("/");
  const me = sidebar(page).getByRole("button", { name: "Change your picture" });
  await expect(me.locator("img")).toHaveAttribute(
    "src",
    /\/avatars\/(rider-at-rest|falconer|the-ride)\.webp/,
  );
  await me.click();
  await sidebar(page).getByRole("radio", { name: "The falconer" }).click();
  await expect(me.locator("img")).toHaveAttribute("src", "/avatars/falconer.webp");
  await page.reload();
  await expect(me.locator("img")).toHaveAttribute("src", "/avatars/falconer.webp");
});
