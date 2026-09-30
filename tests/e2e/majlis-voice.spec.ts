import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Hearing each other in a Majlis (Turki, Day 3): when Sara speaks, everyone else hears her own
// words; said to everyone, that is all; asked of Sarjy, its answer follows. Chromium's fake microphone plays a recorded sentence
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
  await page.getByRole("textbox", { name: /^(Type to Sarjy|Message everyone)…$/ }).fill(text);
  await page.keyboard.press("Enter");
};
const screen = (page: Page) => page.locator("[data-state]").first();

test("everyone hears the speaker; Sarjy answers only when asked; the seats settle (AT-99e, AT-99g)", async ({
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

  // What Sara's own screen is sent back for each turn (buffered here, so it can be read).
  const turns: string[] = [];
  await guest.route("**/api/turn", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    turns.push(body);
    await route.fulfill({ response, body });
  });
  const nextTurn = async () => {
    const before = turns.length;
    await guest.getByRole("button", { name: "Talk to Sarjy" }).click();
    await expect.poll(() => turns.length, { timeout: 20_000 }).toBe(before + 1);
    return turns.at(-1)!;
  };

  // First to everyone (the default): Turki hears Sara's words, and nothing from Sarjy.
  let spoken = await nextTurn();
  expect(spoken).toContain('"forRoom":true');
  expect(spoken).not.toContain('"type":"segment"');
  await expect(host.locator("main section [data-seat]").filter({ hasText: "Hello" })).toContainText("Sara", {
    timeout: 10_000,
  });
  await expect.poll(() => fetched.length, { timeout: 10_000 }).toBe(1);
  await expect(screen(guest)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });

  // Then to Sarjy: Turki hears Sara's words, then Sarjy's answer.
  fetched.length = 0;
  await guest.getByRole("radio", { name: "Sarjy" }).click();
  spoken = await nextTurn();
  const segments = spoken.split("\n").filter((line) => line.includes('"type":"segment"')).length;
  expect(segments).toBeGreaterThan(0);
  await expect(screen(host)).toHaveAttribute("data-state", "idle", { timeout: 20_000 });
  // One more than Sarjy's sentences: Sara's own recording, heard first.
  expect(fetched).toHaveLength(segments + 1);

  // The turn is over: nobody is left beside the cup, on either screen, and the mic is free.
  await expect(host.locator("main section li[data-active]")).toHaveCount(0);
  await expect(screen(guest)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });
  await expect(guest.locator("main section li[data-active]")).toHaveCount(0);
  await expect(host.getByText(/^Tap to talk to everyone/)).toBeVisible();
});
