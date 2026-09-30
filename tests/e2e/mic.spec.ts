import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

// The real mic path in a real browser: Chromium's fake microphone plays a recorded sentence
// (tests/fixtures/hello-sarjy.wav, then silence). The speech detector hears it start and end,
// the recording goes to /api/turn as a WAV, and the fake speech to text returns "Hello".
// Acceptance tests AT-01 (a voice turn), AT-02 (the turn ends on its own), AT-07 (hands-free: the
// next turn needs no tap). AT-03 (tap to close) is in mic-cough.spec.ts, on a silent start.

const speech = fileURLToPath(new URL("../fixtures/hello-sarjy.wav", import.meta.url));

test.use({
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${speech}`,
      "--autoplay-policy=no-user-gesture-required",
    ],
  },
  permissions: ["microphone"],
});

const screen = (page: import("@playwright/test").Page) => page.locator("[data-state]").first();

test("tap the mic, speak, and Sarjy answers when you stop", async ({ page }) => {
  await page.goto("/");
  const mic = page.getByRole("button", { name: "Talk to Sarjy" });
  await mic.click();

  await expect(screen(page)).toHaveAttribute("data-state", "listening", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: /stop/i })).toHaveAttribute("aria-pressed", "true");

  // The detector ends the turn on its own once the sentence is over.
  await expect(screen(page)).toHaveAttribute("data-state", /thinking|tool|speaking/, { timeout: 15_000 });
  // "Hello" was heard, and Sarjy introduces itself (a first visit).
  await expect(page.locator("main section p[lang]")).toHaveText(/I'm Sarjy/, { timeout: 10_000 });

  // Hands-free: once Sarjy has answered, it listens again without a tap. Escape stops the conversation.
  await expect(screen(page)).toHaveAttribute("data-state", "listening", { timeout: 15_000 });
  await page.keyboard.press("Escape");
  await expect(screen(page)).toHaveAttribute("data-state", "idle");
});
