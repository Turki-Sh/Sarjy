import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

// A sound too short to be a turn (a cough, a click): the speech detector starts, then drops it.
// The fake microphone plays 5 s of silence (so the detector has surely loaded), 160 ms of speech,
// then silence. Listening must carry on, and when
// nothing more is said the screen rests. It must never stay on "Listening" with the mic closed
// (Turki's report, Day 2: stuck until a typed message fixed it).

const cough = fileURLToPath(new URL("../fixtures/cough.wav", import.meta.url));

test.use({
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${cough}`,
      "--autoplay-policy=no-user-gesture-required",
    ],
  },
  permissions: ["microphone"],
});

test("a cough while listening never leaves the screen stuck on Listening", async ({ page }) => {
  test.setTimeout(40_000);
  let turns = 0;
  page.on("request", (r) => void (r.url().endsWith("/api/turn") && turns++));
  await page.goto("/");
  await page.getByRole("button", { name: "Talk to Sarjy" }).click();
  const screen = page.locator("[data-state]").first();
  await expect(screen).toHaveAttribute("data-state", "listening", { timeout: 15_000 });

  // Nothing worth sending was said: the conversation rests, and no turn was sent.
  await expect(screen).toHaveAttribute("data-state", "idle", { timeout: 18_000 });
  await expect(page.getByRole("button", { name: "Talk to Sarjy" })).toHaveAttribute("aria-pressed", "false");
  expect(turns).toBe(0);
});

// AT-03: here the microphone is silent for its first 5 s, so the tap surely comes before speech
// (with a sentence from the start, the tap raced it and sometimes sent the words, as it should).
test("tapping the orb while listening, before speaking, closes it quietly", async ({ page }) => {
  let turns = 0;
  page.on("request", (r) => void (r.url().endsWith("/api/turn") && turns++));
  await page.goto("/");
  await page.getByRole("button", { name: "Talk to Sarjy" }).click();
  const screen = page.locator("[data-state]").first();
  await expect(screen).toHaveAttribute("data-state", "listening", { timeout: 15_000 });
  await page.getByRole("button", { name: /stop/i }).click();
  await expect(screen).toHaveAttribute("data-state", "idle");
  expect(turns).toBe(0);
});
