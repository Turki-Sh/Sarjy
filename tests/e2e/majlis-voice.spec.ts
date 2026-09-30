import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Hearing each other in a Majlis (Turki, Day 3): when Sara speaks, everyone else hears her own
// words first, then Sarjy's answer. Chromium's fake microphone plays a recorded sentence
// (tests/fixtures/hello-sarjy.wav) for both people. Acceptance test AT-99e.

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

const say = async (page: Page, text: string) => {
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill(text);
  await page.keyboard.press("Enter");
};
const screen = (page: Page) => page.locator("[data-state]").first();

test("everyone else hears what the speaker said, then Sarjy's answer, and the seats settle (AT-99e)", async ({
  browser,
}) => {
  const context = { permissions: ["microphone"] };
  const host = await (await browser.newContext(context)).newPage();
  const guest = await (await browser.newContext(context)).newPage();
  await Promise.all([host.waitForResponse("**/api/session"), host.goto("/")]);
  await say(host, "My name is Turki.");
  await expect(screen(host)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });
  await host.getByRole("button", { name: "Start a Majlis" }).click();
  await expect(host).toHaveURL(/\/majlis\//);
  await Promise.all([guest.waitForResponse("**/api/session"), guest.goto(host.url())]);
  await guest.getByRole("textbox", { name: "What should everyone call you?" }).fill("Sara");
  await guest.getByRole("button", { name: "Come in" }).click();
  await expect(host.getByRole("group", { name: /Majlis/ })).toContainText("2 here");

  // Everything Turki's screen fetches from the room: Sara's words and Sarjy's sentences.
  const fetched: string[] = [];
  host.on("request", (r) => {
    if (/\/api\/rooms\/[^/]+\/media\//.test(r.url())) fetched.push(r.url());
  });

  const turn = guest.waitForResponse("**/api/turn");
  await guest.getByRole("button", { name: "Talk to Sarjy" }).click();
  const spoken = await (await turn).text();
  const segments = spoken.split("\n").filter((line) => line.includes('"type":"segment"')).length;
  expect(segments).toBeGreaterThan(0);

  await expect(host.locator("main section li[data-seat]").filter({ hasText: "Hello" })).toContainText(
    "Sara",
    {
      timeout: 10_000,
    },
  );
  await expect(screen(host)).toHaveAttribute("data-state", "idle", { timeout: 20_000 });
  // One more than Sarjy's sentences: Sara's own recording, heard first.
  expect(fetched).toHaveLength(segments + 1);

  // The turn is over: nobody is left beside the cup, on either screen, and the mic is free.
  await expect(host.locator("main section li[data-active]")).toHaveCount(0);
  await expect(screen(guest)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });
  await expect(guest.locator("main section li[data-active]")).toHaveCount(0);
  await expect(host.getByText("Tap the finjan to talk")).toBeVisible();
});
