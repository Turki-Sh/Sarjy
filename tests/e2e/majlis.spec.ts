import { expect, test, type Browser, type Page } from "@playwright/test";

// The Majlis (M6): two people in two browsers, one Sarjy. Both see and hear every turn, each turn
// wears its speaker's color, memory stays each person's own, and a picture that fails the guard
// is never shown to the room. Acceptance tests AT-90 to AT-99d, and AT-102.

const say = async (page: Page, text: string) => {
  await page.getByRole("textbox", { name: /^(Type to Sarjy|Message everyone)…$/ }).fill(text);
  await page.keyboard.press("Enter");
};
/** The caption under the orb (not the screen-reader copy of it). */
const caption = (page: Page) => page.locator("main section p[lang]");
const screen = (page: Page) => page.locator("[data-state]").first();
/** Asks Sarjy, with the switch over the text box (people talk to everyone by default). */
const ask = async (page: Page, text: string) => {
  await page.getByRole("radio", { name: "Sarjy" }).click();
  await say(page, text);
};
const bar = (page: Page) => page.getByRole("group", { name: /Majlis/ });

/** Turki opens a Majlis (after telling Sarjy his name and a private fact); Sara comes in by link. */
async function twoInAMajlis(browser: Browser) {
  const host = await (await browser.newContext()).newPage();
  const guest = await (await browser.newContext()).newPage();
  // Wait for the visit to be known before talking, so the first turn and the page are one person.
  await Promise.all([host.waitForResponse("**/api/session"), host.goto("/talk")]);
  await say(host, "My name is Turki.");
  await expect(screen(host)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });
  await say(host, "My favorite color is green.");
  await expect(caption(host)).toHaveText("Got it.", { timeout: 10_000 });
  await expect(screen(host)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });

  await host.getByRole("button", { name: "Start a Majlis" }).click();
  await expect(host).toHaveURL(/\/majlis\/[2-9A-Z]{5}$/);
  await expect(bar(host)).toContainText("Turki's Majlis");

  await Promise.all([guest.waitForResponse("**/api/session"), guest.goto(host.url())]);
  await expect(guest.getByRole("dialog", { name: "Turki's Majlis" })).toBeVisible();
  await guest.getByRole("textbox", { name: "What should everyone call you?" }).fill("Sara");
  await guest.getByRole("button", { name: "Come in" }).click();
  await expect(bar(guest)).toBeVisible();
  await expect(bar(host)).toContainText("2 here");
  return { host, guest };
}

test("two people in one Majlis see every turn, each in their own color (AT-90, AT-91, AT-92, AT-95, AT-98, AT-99a, AT-99c, AT-99d)", async ({
  browser,
}) => {
  const { host, guest } = await twoInAMajlis(browser);
  // The finjan sits in the orb instead of the wave.
  await expect(host.locator("[data-majlis] svg path").first()).toBeAttached();

  // Everyone sits around the finjan in their own profile picture.
  const seats = host.getByRole("list", { name: "Who's here" }).getByRole("listitem");
  await expect(seats).toHaveCount(2);
  await expect(seats.first().locator("img")).toHaveAttribute("src", /^\/avatars\/[a-z-]+\.webp$/);

  // Sara's answer is slowed down, so there is time to see whose turn it is on Turki's screen.
  await guest.route("**/api/turn", (route) =>
    route.continue({ headers: { ...route.request().headers(), "x-sarjy-fake-slow-voice": "2500" } }),
  );
  // Said to everyone (the default): no Sarjy, no answer. Turki sees her words, in her color.
  await say(guest, "Hi everyone, Sara here");
  await expect(
    host.locator("main section [data-seat]").filter({ hasText: "Hi everyone, Sara here" }),
  ).toContainText("Sara", { timeout: 10_000 });
  await expect(screen(guest)).toHaveAttribute("data-state", "idle");
  await expect(screen(host)).toHaveAttribute("data-state", "idle");
  await expect(host.locator("main section .glass").filter({ hasText: /Sarjy|weather/ })).toHaveCount(0);

  await ask(guest, "Hello from Sara");
  // While Sarjy answers her, she sits beside the cup with her name over her, and the screen says so.
  await expect(host.locator("main section li[data-active]")).toContainText("Sara", { timeout: 10_000 });
  await expect(host.getByText("Sarjy is answering Sara")).toBeVisible();
  // Both screens show Sara's words and Sarjy's answer.
  await expect(screen(guest)).toHaveAttribute("data-state", "speaking", { timeout: 10_000 });
  await expect(screen(guest)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });
  const answer = (await caption(guest).textContent()) ?? "";
  // Once Sarjy has answered, Sara goes back to her seat on both screens.
  await expect(screen(host)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });
  await expect(host.locator("main section li[data-active]")).toHaveCount(0);
  expect(answer).not.toBe("Hello from Sara");
  await expect(host.locator("main section li").filter({ hasText: "Hello from Sara" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(caption(host)).toHaveText(answer);
  // Sara's line wears her seat, with her name, on both screens; on hers it says "You".
  const onHost = host.locator("main section li[data-seat]").filter({ hasText: "Hello from Sara" });
  await expect(onHost).toHaveAttribute("data-seat", "1");
  await expect(onHost).toContainText("Sara");
  await expect(
    guest.locator("main section li[data-seat]").filter({ hasText: "Hello from Sara" }),
  ).toContainText("You");

  // Someone who comes in later sees what was said, with who said it.
  const late = await (await browser.newContext()).newPage();
  await Promise.all([late.waitForResponse("**/api/session"), late.goto(host.url())]);
  await late.getByRole("textbox", { name: "What should everyone call you?" }).fill("Noura");
  await late.getByRole("button", { name: "Come in" }).click();
  await expect(
    late.locator("main section li[data-seat]").filter({ hasText: "Hello from Sara" }),
  ).toContainText("Sara");
  await expect(bar(host)).toContainText("3 here");

  // The room's chat is in both Recents, as a Majlis.
  await expect(
    guest
      .getByRole("complementary")
      .getByRole("button", { name: "Majlis: Hi everyone, Sara here", exact: true }),
  ).toBeVisible({
    timeout: 10_000,
  });
});

test("memory stays each person's own in a Majlis (AT-96, AT-97)", async ({ browser }) => {
  const { host, guest } = await twoInAMajlis(browser);
  // Sara asks for "her" favorite color: Turki's is never in her turn.
  await ask(guest, "What's my favorite color?");
  await expect(caption(guest)).toHaveText(/don't have/, { timeout: 10_000 });
  await expect(caption(host)).toHaveText(/don't have/, { timeout: 10_000 });
  await expect(screen(host)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });
  await expect(screen(guest)).toHaveAttribute("data-state", "idle", { timeout: 10_000 });

  // Turki asks for his: Sarjy knows it, and Sara hears the answer (he asked aloud).
  await ask(host, "What's my favorite color?");
  await expect(caption(host)).toHaveText("Green. You told me today.", { timeout: 10_000 });
  await expect(caption(guest)).toHaveText("Green. You told me today.", { timeout: 10_000 });
  // Sara's memory holds only what she gave at the door (her name); Turki's color never reached it.
  await expect(guest.getByRole("complementary").getByRole("button", { name: /^Memory\s*1$/ })).toBeVisible();
});

test("a picture that fails the guard is never shown to the room (AT-99b)", async ({ browser }) => {
  const { host, guest } = await twoInAMajlis(browser);
  await guest.route("**/api/turn", (route) =>
    route.continue({ headers: { ...route.request().headers(), "x-sarjy-fake-unsafe-picture": "1" } }),
  );
  // Attach until the preview shows: right after joining, the room's screen can still re-render and
  // drop a picture picked in that instant (CI caught it twice). What is checked doesn't change.
  await expect(async () => {
    await guest.locator('form input[type="file"]').setInputFiles("public/wallpapers/sunlit.jpg");
    await expect(guest.getByRole("button", { name: "Remove the picture" })).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 20_000 });
  await say(guest, "Look at this");
  await expect(caption(guest)).toHaveText("I didn't share that picture with the Majlis.", {
    timeout: 10_000,
  });
  await expect(host.locator('main section img[class*="picture"]')).toHaveCount(0);
  await expect(host.locator("main section li").filter({ hasText: "Look at this" })).toHaveCount(0);
});

test("the host ends the Majlis for everyone (AT-99)", async ({ browser }) => {
  const { host, guest } = await twoInAMajlis(browser);
  await bar(host).getByRole("button", { name: "Who's here" }).click();
  await host.getByRole("menuitem", { name: "End for everyone" }).click();
  // The menu asks once more before anything irreversible.
  await host.getByRole("menuitem", { name: /End/ }).last().click();
  await expect(guest.getByRole("dialog", { name: "Turki's Majlis" })).toContainText(
    "This Majlis has ended.",
    {
      timeout: 10_000,
    },
  );
  // A new visitor is turned away at the door.
  const late = await (await browser.newContext()).newPage();
  await late.goto(host.url());
  await expect(late.getByText("This Majlis has ended.")).toBeVisible();
});

test("an invite link says whose Majlis it is, and is never indexed (AT-102)", async ({ browser }) => {
  const { host } = await twoInAMajlis(browser);
  const html = await (await host.request.get(host.url())).text();
  expect(html).toContain("Join Turki&#x27;s Majlis on Sarjy");
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);
  expect(html).toMatch(/og:image" content="[^"]+\.png/);
});

test("a quiet Majlis lets go of its connection, and a tap brings it back", async ({ browser }) => {
  // Turki, Day 5: a tab left open must not hold a realtime connection forever.
  const host = await (await browser.newContext()).newPage();
  const guest = await (await browser.newContext()).newPage();
  await Promise.all([host.waitForResponse("**/api/session"), host.goto("/talk")]);
  await host.getByRole("button", { name: "Start a Majlis" }).click();
  await expect(host).toHaveURL(/\/majlis\/[2-9A-Z]{5}$/);

  await guest.clock.install();
  await Promise.all([guest.waitForResponse("**/api/session"), guest.goto(host.url())]);
  await guest.getByRole("textbox", { name: "What should everyone call you?" }).fill("Sara");
  await guest.getByRole("button", { name: "Come in" }).click();
  await expect(bar(host)).toContainText("2 here");

  // Ten quiet minutes later, the guest's tab has let go: the host sees one fewer here.
  await guest.clock.fastForward("11:00");
  await expect(bar(guest)).toContainText("Dozed off");
  await expect(bar(host)).toContainText("1 here");

  // One tap and it is back.
  await guest.mouse.click(10, 300);
  await expect(bar(guest)).toContainText("2 here");
  await expect(bar(host)).toContainText("2 here");
});
