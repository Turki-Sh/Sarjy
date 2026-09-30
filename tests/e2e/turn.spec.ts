import { expect, test, type Page } from "@playwright/test";

// Typed turns through the real pipeline with fake providers (no keys, no network).
// Acceptance tests AT-04 (text works), AT-10, AT-11, AT-30, AT-40, AT-44.

const say = async (page: Page, text: string) => {
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill(text);
  await page.keyboard.press("Enter");
};
const screen = (page: Page) => page.locator("[data-state]").first();
/** The caption under the orb (not the screen-reader copy of it). */
const caption = (page: Page) => page.locator("main section p[lang]");

test("saves a fact, stitches it, and remembers it after a reload", async ({ page }) => {
  await page.goto("/");
  await say(page, "My favorite color is green.");

  await expect(screen(page)).toHaveAttribute("data-state", /thinking|tool|speaking/);
  await expect(screen(page)).toHaveAttribute("data-state", "saving", { timeout: 10_000 });
  // The moment it is remembered: the stitched card under the orb, and the Memory count in the sidebar.
  await expect(page.getByRole("button", { name: /^Saved: Favorite color, Green/ })).toBeVisible();
  await expect(page.getByRole("complementary").getByRole("button", { name: /Memory\s*1/ })).toBeVisible();
  await expect(page.locator("p[lang] span[class*=keep]")).toHaveText(/favorite color is green/i);
  await expect(screen(page)).toHaveAttribute("data-state", "idle", { timeout: 5_000 });

  await page.reload();
  await page
    .getByRole("complementary")
    .getByRole("button", { name: /Memory/ })
    .click();
  await expect(page.getByRole("dialog").getByText("Green", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await say(page, "What's my favorite color?");
  await expect(caption(page)).toHaveText("Green. You told me today.", { timeout: 10_000 });
});

test("checks the weather with a timed tool chip", async ({ page }) => {
  await page.goto("/");
  await say(page, "What's the weather in Riyadh tomorrow?");
  await expect(page.getByText('weather.forecast("Riyadh", "tomorrow")')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/\d+ ms/)).toBeVisible();
  await expect(caption(page)).toHaveText(/high of 41/, { timeout: 10_000 });
});

test("the whole answer plays even when the rest of it arrives after the first sentence ended", async ({
  page,
}) => {
  // Seen live on Day 2: "Sure thing." played, then silence. The rest arrived late, and the screen
  // took the silence for the end. Here the stand-in voice delivers the rest 1.5 s late on purpose.
  await page.setExtraHTTPHeaders({ "x-sarjy-fake-slow-voice": "1500" });
  // Live, the rest of an answer is seconds of audio and takes a moment to decode; a test clip
  // decodes faster than one frame. So decoding every piece after the first is slowed here too.
  await page.addInitScript(() => {
    const decode = AudioContext.prototype.decodeAudioData;
    let calls = 0;
    AudioContext.prototype.decodeAudioData = function (this: AudioContext, data: ArrayBuffer) {
      const decoded = decode.call(this, data);
      return calls++ === 0 ? decoded : new Promise((resolve) => setTimeout(() => resolve(decoded), 400));
    } as typeof decode;
  });
  await page.goto("/");
  await say(page, "My favorite color is green.");
  await expect(screen(page)).toHaveAttribute("data-state", "saving", { timeout: 15_000 });
  await expect(caption(page)).toHaveText("Saved. Your favorite color is green.");
});

// Past Groq's daily limit the voice returns nothing and the browser reads instead (Turki's review,
// Day 2: "the English suddenly turned robotic"). The answer still shows, and Sarjy says once why
// its voice changed.
test("when Sarjy's voice is out, the answer still comes, and the screen says why once", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-sarjy-fake-voice-out": "1" });
  await page.goto("/");
  const box = page.getByRole("textbox", { name: "Type to Sarjy…" });
  const note = page.getByRole("status").filter({ hasText: "My voice is taking a break" });
  await box.fill("What's the weather in Riyadh tomorrow?");
  await box.press("Enter");
  await expect(note).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("main section p[lang]")).toHaveText(/Riyadh/, { timeout: 15_000 });
  // And it comes to rest, even where the browser never says its voice has finished (this headless
  // browser has no voices at all): Sarjy never stays on "Speaking".
  await expect(page.locator("[data-state]").first()).toHaveAttribute("data-state", "idle", {
    timeout: 20_000,
  });

  // Only once a visit.
  await expect(note).toHaveCount(0, { timeout: 8_000 });
  await box.fill("What's the weather in Jeddah tomorrow?");
  await box.press("Enter");
  await expect(page.locator("main section p[lang]")).toHaveText(/Jeddah/, { timeout: 15_000 });
  await expect(note).toHaveCount(0);
});
