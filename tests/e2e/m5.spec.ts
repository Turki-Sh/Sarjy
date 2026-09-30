import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

// The interface deep dive (M5): how an answer was made, voices, pictures, the phone layout,
// the first-visit welcome, and the whole chat.

const photo = fileURLToPath(new URL("../../public/avatars/falconer.webp", import.meta.url));
const say = async (page: Page, text: string) => {
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill(text);
  await page.keyboard.press("Enter");
};
const screen = (page: Page) => page.locator("[data-state]").first();
const idle = (page: Page) => expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 15_000 });

test("how an answer was made: timings, model, tokens and cost", async ({ page }) => {
  await page.goto("/");
  await say(page, "What's the weather in Riyadh tomorrow?");
  await idle(page);
  await page.getByRole("button", { name: "How this answer was made" }).click();
  const details = page.getByRole("region", { name: "How this answer was made" });
  await expect(details.getByText("First word")).toBeVisible();
  await expect(details.getByText("Done")).toBeVisible();
  await expect(details.getByText("fake-main")).toBeVisible();
  await expect(details.getByText(/^\$0\.\d+/)).toBeVisible();

  // It closes like any popover (Turki's report, Day 2: "I can't remove it"): its X, Escape, a tap
  // anywhere else, or the ⓘ again.
  const info = page.getByRole("button", { name: "How this answer was made" });
  await details.getByRole("button", { name: "Close" }).click();
  await expect(details).toHaveCount(0);
  await info.click();
  await page.keyboard.press("Escape");
  await expect(details).toHaveCount(0);
  await info.click();
  await page.mouse.click(10, 400);
  await expect(details).toHaveCount(0);
  await info.click();
  await expect(details).toBeVisible();
  await info.click();
  await expect(details).toHaveCount(0);
});

test("Settings, Voice: pick a voice per language, hear it, and keep it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Voice", exact: true }).click();
  const diana = page.getByRole("radio", { name: "Diana" });
  await expect(page.getByRole("radio", { name: "Troy" })).toHaveAttribute("aria-checked", "true");
  await diana.click();
  await expect(diana).toHaveAttribute("aria-checked", "true");
  const preview = await page.request.get("/api/voices/preview?lang=en&voice=diana");
  expect(preview.headers()["content-type"]).toBe("audio/wav");
  await page.reload();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Voice", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Diana" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio", { name: "Abdullah" })).toHaveAttribute("aria-checked", "true");
});

test("a picture goes with the turn, shows in your bubble, and Sarjy answers about it", async ({ page }) => {
  await page.goto("/");
  await page.locator('form input[type="file"]').setInputFiles(photo);
  await expect(page.getByRole("button", { name: "Remove the picture" })).toBeVisible();
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator("main section p[lang]")).toHaveText("I can see your picture. Nice one.", {
    timeout: 15_000,
  });
  await expect(page.locator("main section ol li img")).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove the picture" })).toHaveCount(0);

  // The picture stays with the chat (Turki's report, Day 2): reopened later, it is still in your
  // bubble, and Sarjy can still answer about it.
  await idle(page);
  const sidebar = page.getByRole("complementary");
  await sidebar.getByRole("button", { name: "New chat" }).click();
  await expect(page.locator("main section ol li img")).toHaveCount(0);
  await sidebar.getByRole("button", { name: "What's in this picture?", exact: true }).click();
  const kept = page.locator("main section ol li img");
  await expect(kept).toHaveAttribute("src", /^\/api\/pictures\/[0-9a-f-]{36}$/);
  await expect.poll(() => kept.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await say(page, "What was in the picture again?");
  await expect(page.locator("main section p[lang]")).toHaveText("Yes, I can still see your picture.", {
    timeout: 15_000,
  });
});

test("on a phone, the sidebar is a sheet you open and it closes when you pick", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const side = page.getByRole("complementary");
  await expect(side).toBeHidden();
  await page.getByRole("button", { name: "Open sidebar" }).click();
  await expect(side).toBeVisible();
  await side.getByRole("button", { name: "New chat" }).click();
  await expect(side).toBeHidden();
});

test("a first visit gets a quiet welcome, and Skip means Sarjy won't ask your name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Hey, I'm Sarjy\. Tap me and say hi/)).toBeVisible();
  await page.getByRole("button", { name: "Skip the intro" }).click();
  await expect(page.getByText(/Hey, I'm Sarjy\. Tap me and say hi/)).toHaveCount(0);
  await say(page, "Hello");
  await idle(page);
  await expect(page.locator("main section p[lang]")).not.toHaveText(/What should I call you/);
});

test("the whole chat opens above the latest bubbles", async ({ page }) => {
  await page.goto("/");
  for (const t of [
    "My favorite color is green.",
    "My favorite food is kabsa.",
    "What's my favorite color?",
  ]) {
    await say(page, t);
    await idle(page);
  }
  await expect(page.locator("main section ol li")).toHaveCount(3);
  await page.getByRole("button", { name: "Show the whole chat (6)" }).click();
  await expect(page.locator("main section ol li")).toHaveCount(5);
  await page.getByRole("button", { name: "Show less" }).click();
  await expect(page.locator("main section ol li")).toHaveCount(3);
});

// On a short window (Turki's review, Day 2): no bubble is ever cut by the edge of the list, and the
// whole chat stays above the text box, with the orb stepping back to make room.
test("on a short window, bubbles are never cut and the whole chat stays above the text box", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  for (const t of [
    "My favorite color is green.",
    "My favorite food is kabsa.",
    "What's my favorite color?",
    "What's the weather in Riyadh tomorrow?",
  ]) {
    await say(page, t);
    await idle(page);
  }
  const list = page.locator("main section div:has(> ol)");
  const cut = () =>
    list.evaluate((box) => {
      const edge = box.getBoundingClientRect().top + parseFloat(getComputedStyle(box).paddingTop);
      return [...box.querySelectorAll("li")].filter(
        (li) => getComputedStyle(li).visibility !== "hidden" && li.getBoundingClientRect().top < edge - 1,
      ).length;
    });
  expect(await cut()).toBe(0);

  const orb = page.getByRole("button", { name: "Talk to Sarjy" });
  const before = (await orb.boundingBox())!.width;
  await page.getByRole("button", { name: /Show the whole chat/ }).click();
  await expect.poll(async () => (await orb.boundingBox())!.width).toBeLessThan(before * 0.7);
  await expect
    .poll(async () => {
      const bottom = (await list.boundingBox())!;
      const dock = (await page.getByRole("textbox", { name: "Type to Sarjy…" }).boundingBox())!;
      return bottom.y + bottom.height <= dock.y;
    })
    .toBe(true);
});
