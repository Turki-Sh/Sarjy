import { expect, test, type Page } from "@playwright/test";
import { STRINGS } from "@/shared/i18n";

// Moving between chats should be felt: New chat clears the stage and says so, a past chat reopens
// with its last answer, search filters as you type, and the sidebar folds away and comes back.

const say = async (page: Page, text: string) => {
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill(text);
  await page.keyboard.press("Enter");
};
const screen = (page: Page) => page.locator("[data-state]").first();
const caption = (page: Page) => page.locator("main section p[lang]");
const sidebar = (page: Page) => page.getByRole("complementary");
const FRESH_LINES = STRINGS.en.freshChat.map((l) => l.replace(/[.?]/g, "\\$&")).join("|");

test("new chat, reopening a past chat, and search", async ({ page }) => {
  await page.goto("/talk");
  await say(page, "My favorite food is kabsa.");
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 15_000 });

  // The chat now shows in Recent, marked as the one on screen; New chat is not.
  const chat = sidebar(page).getByRole("button", { name: "My favorite food is kabsa.", exact: true });
  await expect(chat).toHaveAttribute("aria-current", "page");
  await expect(sidebar(page).getByRole("button", { name: "New chat" })).not.toHaveAttribute("aria-current");

  await sidebar(page).getByRole("button", { name: "New chat" }).click();
  // One of Turki's new-chat lines, picked at random.
  await expect(page.locator("main section > p").last()).toHaveText(new RegExp(FRESH_LINES));
  await expect(caption(page)).toHaveCount(0);
  await expect(sidebar(page).getByRole("button", { name: "New chat" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await chat.click();
  await expect(page.getByText("Picking up where you left off")).toBeVisible();
  // The last answer is on screen, and what you said sits above it.
  await expect(caption(page)).toHaveText("Got it.");
  await expect(page.locator("main section ol li").last()).toHaveText(/kabsa/i);
  await expect(chat).toHaveAttribute("aria-current", "page");

  // Search filters chats as you type.
  const search = sidebar(page).getByRole("searchbox", { name: "Search" });
  await search.fill("kabsa");
  await expect(chat).toBeVisible();
  await search.fill("pizza");
  await expect(sidebar(page).getByText("Nothing matches").first()).toBeVisible();
  await expect(chat).toHaveCount(0);
});

test("the sidebar closes, stays closed after a reload, and reopens", async ({ page }) => {
  await page.goto("/talk");
  await sidebar(page).getByRole("button", { name: "Close sidebar" }).click();
  await expect(sidebar(page)).toHaveCount(0);
  await page.reload();
  await expect(sidebar(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Open sidebar" }).click();
  await expect(sidebar(page)).toBeVisible();
});

test("there is no End button: tapping the orb or pressing Escape stops Sarjy", async ({ page }) => {
  await page.goto("/talk");
  await expect(page.getByRole("button", { name: "End", exact: true })).toHaveCount(0);
  await say(page, "What's the weather in Riyadh tomorrow?");
  await expect(screen(page)).toHaveAttribute("data-state", /thinking|tool|speaking/);
  await page.keyboard.press("Escape");
  await expect(screen(page)).toHaveAttribute("data-state", "idle");
});

test("rename a chat: Enter saves, Escape leaves it as it was", async ({ page }) => {
  await page.goto("/talk");
  await say(page, "My favorite color is green.");
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 15_000 });

  await sidebar(page).getByRole("button", { name: "More options: My favorite color is green." }).click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  const field = sidebar(page).getByRole("textbox", { name: "Rename" });
  await field.fill("Colors");
  await field.press("Enter");
  await expect(sidebar(page).getByRole("button", { name: "Colors", exact: true })).toBeVisible();

  await sidebar(page).getByRole("button", { name: "More options: Colors" }).click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await sidebar(page).getByRole("textbox", { name: "Rename" }).fill("Never mind");
  await sidebar(page).getByRole("textbox", { name: "Rename" }).press("Escape");
  await page.reload();
  await expect(sidebar(page).getByRole("button", { name: "Colors", exact: true })).toBeVisible();
});

test("earlier lines of the chat show small above the caption, and change with the chat", async ({ page }) => {
  await page.goto("/talk");
  await say(page, "My favorite color is green.");
  await expect(screen(page)).toHaveAttribute("data-state", /saving|idle/, { timeout: 15_000 });
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 5_000 });
  const earlier = page.locator("main section ol li");
  // The question stays in view above Sarjy's answer.
  await expect(earlier.last()).toHaveText("My favorite color is green.");

  await sidebar(page).getByRole("button", { name: "New chat" }).click();
  await expect(earlier).toHaveCount(0);
});

test("pin keeps a chat at the top; delete asks once, then removes it", async ({ page }) => {
  await page.goto("/talk");
  await say(page, "My favorite food is kabsa.");
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 15_000 });
  await sidebar(page).getByRole("button", { name: "New chat" }).click();
  await say(page, "My favorite color is green.");
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 15_000 });
  const titles = () =>
    sidebar(page).locator("li button[aria-current], li > button:first-child").allInnerTexts();
  expect((await titles())[0]).toContain("green");

  // Pin the older chat: it moves to the top, and stays there after a reload.
  await sidebar(page).getByRole("button", { name: "More options: My favorite food is kabsa." }).click();
  await page.getByRole("menuitem", { name: "Pin" }).click();
  await expect.poll(async () => (await titles())[0]).toContain("kabsa");
  await page.reload();
  await expect.poll(async () => (await titles())[0]).toContain("kabsa");

  // Delete asks "Delete for good?" in place, then removes the chat.
  await sidebar(page).getByRole("button", { name: "More options: My favorite food is kabsa." }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("menuitem", { name: "Delete for good?" }).click();
  await expect(
    sidebar(page).getByRole("button", { name: "My favorite food is kabsa.", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    sidebar(page).getByRole("button", { name: "My favorite food is kabsa.", exact: true }),
  ).toHaveCount(0);
});

test("the conversation shows as bubbles: yours and Sarjy's", async ({ page }) => {
  await page.goto("/talk");
  await say(page, "My favorite color is green.");
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 15_000 });
  await say(page, "What's my favorite color?");
  await expect(caption(page)).toHaveText("Green. You told me today.", { timeout: 10_000 });
  const bubbles = page.locator("main section ol li");
  await expect(bubbles).toHaveText(["My favorite color is green.", "Got it.", "What's my favorite color?"]);
});
