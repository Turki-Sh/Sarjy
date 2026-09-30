import { expect, test, type Page } from "@playwright/test";

// Rafeeq, the companion (Turki, Day 3): off by default; picked in Settings, it takes the orb's
// place in your own chats, follows every state, reacts to saves and petting, and grows a bond.
// Never in a Majlis. Acceptance tests AT-110 to AT-116.

const say = async (page: Page, text: string) => {
  await page.getByRole("textbox", { name: "Type to Sarjy…" }).fill(text);
  await page.keyboard.press("Enter");
};
/** The companion in the orb's place (not the previews in Settings). */
const rafeeq = (page: Page) =>
  page.getByRole("button", { name: /^Talk to Sarjy|^Stop/ }).locator("[data-rafeeq]");

async function pick(page: Page, name: RegExp) {
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Rafeeq", exact: true }).click();
  await page.getByRole("radio", { name }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
}

test("a picked Rafeeq replaces the orb, follows a turn, and beams on a save (AT-110, AT-111)", async ({
  page,
}) => {
  await Promise.all([page.waitForResponse("**/api/session"), page.goto("/talk")]);
  // No Rafeeq by default: the orb.
  await expect(rafeeq(page)).toHaveCount(0);

  await pick(page, /^Scout/);
  await expect(rafeeq(page)).toHaveAttribute("data-rafeeq", "scout");
  const pill = page.getByRole("button", { name: /^Your Rafeeq: Scout, New friend$/ });
  await expect(pill).toBeVisible();

  await say(page, "My favorite color is green.");
  await expect(rafeeq(page)).toHaveAttribute("data-state", /thinking|tool|speaking/, { timeout: 10_000 });
  // The fact is stitched in: it beams.
  await expect(rafeeq(page)).toHaveAttribute("data-mood", "happy", { timeout: 10_000 });

  // It stays after a reload, from the very first paint (the cookie), and the bond was kept.
  await page.reload();
  await expect(rafeeq(page)).toHaveAttribute("data-rafeeq", "scout");
  await page.getByRole("button", { name: /^Your Rafeeq/ }).click();
  await expect(page.getByRole("progressbar", { name: "New friend" })).not.toHaveAttribute(
    "aria-valuenow",
    "0",
  );

  // Back to the orb.
  await page.getByRole("radio", { name: /^No Rafeeq/ }).click();
  await page.keyboard.press("Escape");
  await expect(rafeeq(page)).toHaveCount(0);
});

test("petting it makes it happy and grows the bond (AT-112)", async ({ page }) => {
  await Promise.all([page.waitForResponse("**/api/session"), page.goto("/talk")]);
  await pick(page, /^Keeper/);
  const box = (await rafeeq(page).boundingBox())!;
  const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
  const petted = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/rafeeq") &&
      r.request().method() === "POST" &&
      r.request().postData()!.includes("pet"),
  );
  // Every mood it goes through while being stroked.
  await page.evaluate(() => {
    const el = document.querySelector("main button [data-rafeeq]") as HTMLElement;
    (window as unknown as { moods: string[] }).moods = [];
    new MutationObserver(() =>
      (window as unknown as { moods: string[] }).moods.push(el.dataset.mood!),
    ).observe(el, {
      attributes: true,
      attributeFilter: ["data-mood"],
    });
  });
  await page.mouse.move(cx - 60, cy);
  for (let i = 0; i < 5; i++) {
    await page.mouse.move(cx + 60, cy, { steps: 6 });
    await page.mouse.move(cx - 60, cy, { steps: 6 });
  }
  // Happy for a moment (it may already be over by the end of the stroke).
  expect(await page.evaluate(() => (window as unknown as { moods: string[] }).moods)).toContain("petted");
  expect(await (await petted).json()).toMatchObject({ gained: 1 });
});

test("a Majlis keeps the finjan, even with a Rafeeq picked (AT-113)", async ({ page }) => {
  await Promise.all([page.waitForResponse("**/api/session"), page.goto("/talk")]);
  await pick(page, /^Drifter/);
  await expect(rafeeq(page)).toBeVisible();
  await page.getByRole("button", { name: "Start a Majlis" }).click();
  await expect(page).toHaveURL(/\/majlis\//);
  await expect(page.getByRole("group", { name: /Majlis/ })).toBeVisible();
  await expect(rafeeq(page)).toHaveCount(0);
  await expect(page.locator("main [data-majlis] svg")).toBeVisible();
});

test("each companion has its own bond, kept when you switch (AT-115)", async ({ page }) => {
  await Promise.all([page.waitForResponse("**/api/session"), page.goto("/talk")]);
  await pick(page, /^Scout/);
  await say(page, "My favorite color is green.");
  await expect(rafeeq(page)).toHaveAttribute("data-mood", "happy", { timeout: 10_000 });

  const progress = () => page.getByRole("dialog").getByRole("progressbar");
  await page.getByRole("button", { name: /^Your Rafeeq/ }).click();
  await expect(progress()).not.toHaveAttribute("aria-valuenow", "0");
  // Keeper starts fresh...
  await page.getByRole("radio", { name: /^Keeper/ }).click();
  await expect(progress()).toHaveAttribute("aria-valuenow", "0");
  // ...and Scout's bond was kept.
  await page.getByRole("radio", { name: /^Scout/ }).click();
  await expect(progress()).not.toHaveAttribute("aria-valuenow", "0");
});

test("each companion has its own personality: Fennec gets annoyed, Keeper goes shy (AT-116)", async ({
  page,
}) => {
  await Promise.all([page.waitForResponse("**/api/session"), page.goto("/talk")]);
  const restOn = async () => {
    const box = (await rafeeq(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 3 });
  };

  await pick(page, /^Fennec/);
  await expect(rafeeq(page)).toHaveAttribute("data-temper", "annoyed");
  await restOn();
  // Wary for a moment, then annoyed if you stay.
  await expect(rafeeq(page)).toHaveAttribute("data-expr", "wary");
  await expect(rafeeq(page)).toHaveAttribute("data-expr", "annoyed", { timeout: 5_000 });
  await page.mouse.move(5, 5);
  await expect(rafeeq(page)).not.toHaveAttribute("data-expr", /wary|annoyed/);

  await pick(page, /^Keeper/);
  await expect(rafeeq(page)).toHaveAttribute("data-expr", "content");
  await restOn();
  await expect(rafeeq(page)).toHaveAttribute("data-expr", "shy");

  // Each tells its own story in Settings.
  await page.getByRole("button", { name: /^Your Rafeeq/ }).click();
  await expect(page.getByRole("dialog").getByText(/satchel of other people's little things/)).toBeVisible();
});
