import { expect, test } from "@playwright/test";

// The home page and the 404 (Turki, Day 4). The home page introduces Sarjy with the Rafeeqs living
// in it and leads to the voice screen at /talk; the 404 is a campfire scene of lost Rafeeqs that
// changes every visit. Acceptance tests AT-117 to AT-123.

test("the home page introduces Sarjy, alive, and leads to the voice screen (AT-117)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Shaped to its rider.");
  // The Rafeeqs are in the picture, not in a showcase: on the headline and on the dunes.
  await expect(page.locator("#hero [data-rafeeq]")).toHaveCount(8);
  await expect(page.getByText(/^Good (morning|afternoon|evening)\.$|^Up late\?$/)).toBeVisible();
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
  await expect(page.getByText(/Turki[.?]$/)).toBeVisible();
  await expect(page.locator("#hero [data-rafeeq='lantern']")).toBeVisible();
  await expect(page.locator("#hero").getByText("Lantern · Lv 1")).toBeVisible();
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

  // Asking for directions plays another scene.
  const before = await stage.getAttribute("data-vignette");
  await page.getByRole("button", { name: "Ask someone else for directions" }).click();
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
