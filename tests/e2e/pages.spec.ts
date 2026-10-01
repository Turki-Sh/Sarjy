import { expect, test } from "@playwright/test";
import { t } from "@/shared/i18n";

// The home page and the 404 (Turki, Day 4). The home page introduces Sarjy with the Rafeeqs living
// in it and leads to the voice screen at /talk; the 404 is a campfire scene of lost Rafeeqs that
// changes every visit. Acceptance tests AT-117 to AT-123.

/** A day-time or night-time clock for the page (it follows the clock where you are). */
const morning = () => new Date(2026, 9, 1, 10, 0);
const lateNight = () => new Date(2026, 9, 1, 22, 30);

test("the home page introduces Sarjy, alive, and leads to the voice screen (AT-117)", async ({ page }) => {
  await page.clock.setFixedTime(morning());
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Shaped to its rider.");
  // The Rafeeqs are in the picture, not in a showcase: on the headline and on the dunes.
  await expect(page.locator("#hero [data-rafeeq]")).toHaveCount(8);
  // Its Rafeeq says hello, in words for the light theme; click the sun and the words turn to night.
  const hello = page.locator("#hero [data-hello]").filter({ hasText: /^(Hey|Welcome|Where|Ready|Good day)/ });
  await expect(hello).toBeVisible();
  await page.locator("#hero").getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page
      .locator("#hero [data-hello]")
      .filter({ hasText: /^(Up late|Quiet night|Still awake|The stars|Night owl)/ }),
  ).toBeVisible();
  // Hovering "Talk to Sarjy" makes them lean in to listen.
  const talk = page.locator("#hero").getByRole("link", { name: "Talk to Sarjy" });
  await talk.hover();
  await expect(page.locator("#hero [data-rafeeq='rider']")).toHaveAttribute("data-state", "listening");
  await talk.click();
  await expect(page).toHaveURL(/\/talk$/);
  await expect(page.getByRole("textbox", { name: "Type to Sarjy…" })).toBeVisible();
});

test("picking a Rafeeq on the home page takes you to talk with it (AT-118)", async ({ page }) => {
  await page.goto("/");
  await page.locator("#finale").scrollIntoViewIfNeeded();
  // The lineup bobs, so it is never still enough to click by position: pick it from the keyboard.
  await page.locator("#finale").getByRole("button", { name: "Ride with Fennec" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/talk$/);
  await expect(page.getByRole("button", { name: /^Talk to Sarjy/ }).locator("[data-rafeeq]")).toHaveAttribute(
    "data-rafeeq",
    "fennec",
  );
});

test("a returning visitor is greeted by name, with their own Rafeeq on the headline (AT-119)", async ({
  page,
}) => {
  await Promise.all([page.waitForResponse("**/api/session"), page.goto("/talk")]);
  await page.request.patch("/api/profile", { data: { name: "Turki" } });
  await page.request.patch("/api/rafeeq", { data: { rafeeq: "lantern" } });
  await page.goto("/");
  await expect(page.locator("#hero [data-hello]").filter({ hasText: /Turki/ })).toBeVisible();
  await expect(page.locator("#hero [data-rafeeq='lantern']")).toBeVisible();
  // No level on the headline: it is a hello, not a scoreboard.
  await expect(page.locator("#hero").getByText(/Lv \d/)).toHaveCount(0);
});

test("the home page in Arabic mirrors and says it all in Arabic (AT-120)", async ({ page, context }) => {
  await context.addCookies([{ name: "sarjy_lang", value: "ar", url: "http://localhost:3100" }]);
  await page.goto("/");
  await expect(page.locator("main").locator("..")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("على مقاس فارسه.");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Shaped to its rider.");
});

test("a day with Sarjy goes from dawn to night, and a forget is said out loud (AT-121)", async ({ page }) => {
  await page.goto("/");
  const day = page.locator("#day");
  await day.scrollIntoViewIfNeeded();
  const slider = page.getByRole("slider", { name: "Time of day" });
  await slider.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "4");
  await expect(day.getByText("Lights out").first()).toBeVisible();
  await expect(day.locator("[data-time]")).toHaveAttribute("data-time", "night");
  await expect(day.getByText("Your sister's birthday, on the 14th. Good night.")).toBeVisible();

  const reins = page.locator("#reins");
  await reins.scrollIntoViewIfNeeded();
  await reins.getByRole("button", { name: "Forget: You live in Riyadh." }).click();
  await expect(reins.getByText("Forgotten. I no longer know your home city.")).toBeVisible();
  await reins.getByRole("button", { name: "Bring them back" }).click();
  await expect(reins.getByRole("button", { name: "Forget: You live in Riyadh." })).toBeEnabled();
});

test("a missing page is a campfire of lost Rafeeqs, a new scene every time (AT-122)", async ({ page }) => {
  const response = await page.goto("/nowhere-at-all");
  expect(response!.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We're lost.");
  const stage = page.locator("[data-vignette]");
  await expect(stage.locator("[data-rafeeq]").first()).toBeVisible();
  // Someone always says something, in their own words.
  await expect(stage.getByRole("paragraph")).toBeVisible({ timeout: 8000 });

  // A small secret: the moon plays another scene.
  const before = await stage.getAttribute("data-vignette");
  // The moon hangs and sways, never still enough to click by position: press it from the keyboard.
  await page.getByRole("button", { name: "Ask someone else for directions" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-vignette]")).not.toHaveAttribute("data-vignette", before!);

  // Stoking the fire cheers everyone up (except whoever is mid-brawl).
  await page.locator("[data-vignette] [data-stoked], [data-vignette] div:has(> span + svg)").first().click();
  await expect(
    page.locator("[data-vignette] [data-mood='happy'], [data-vignette] [data-mood='waking']").first(),
  ).toBeVisible();

  await page.getByRole("link", { name: "Take me home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the 404 speaks Arabic too (AT-123)", async ({ page, context }) => {
  await context.addCookies([{ name: "sarjy_lang", value: "ar", url: "http://localhost:3100" }]);
  await page.goto("/majlis-that-never-was/really");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ضعنا.");
  await expect(page.getByRole("link", { name: "رجعني للرئيسية" })).toBeVisible();
});

test("the voice screen opens on a fresh-chat line, and its logo leads home (AT-124)", async ({ page }) => {
  await page.goto("/talk");
  // Not the generic "Tap Sarjy to talk": one of the lines for a new chat.
  await expect(page.getByText("Tap Sarjy to talk")).toHaveCount(0);
  const fresh = t("en")
    .freshChat.map((line) => line.replace(/[.?]/g, "\\$&"))
    .join("|");
  await expect(page.getByText(new RegExp(`^(${fresh})$`))).toBeVisible();
  await page.getByRole("complementary").getByRole("link", { name: "Sarjy" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the home page and the 404 follow the clock, and a choice holds for a while (AT-125)", async ({
  page,
}) => {
  // Late at night, with no choice made: night on both pages.
  await page.clock.setFixedTime(lateNight());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // Really dark: the page's background is the brand's night (a scene once clobbered that token).
  await expect(page.locator("main").locator("..")).toHaveCSS("background-color", "rgb(17, 17, 17)");
  await page.goto("/not-here");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // The voice screen keeps your own theme (light, by default).
  await page.goto("/");
  await page.locator("#hero").getByRole("link", { name: "Talk to Sarjy" }).click();
  await expect(page).toHaveURL(/\/talk$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  // In the morning: day, and the 404's zero is the sun.
  await page.clock.setFixedTime(morning());
  await page.goto("/not-here");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  // Choosing dark in the morning holds through the day...
  await page.goto("/");
  await page.locator("#hero").getByRole("button", { name: "Dark" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // ...and the next morning the clock leads again.
  await page.clock.setFixedTime(new Date(2026, 9, 2, 9, 0));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
