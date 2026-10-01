// Renders the drawn link-preview cards (cards-entry.ts) to public/og/*.png, 1200 x 630.
// Run after changing a card or the Rafeeq art:   node scripts/og/render.mjs
// The PNGs are committed, like Turki's illustrated cards beside them.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const dir = mkdtempSync(join(tmpdir(), "og-cards-"));
execFileSync("node_modules/.bin/esbuild", [
  "scripts/og/cards-entry.ts",
  "--bundle",
  "--platform=node",
  "--format=esm",
  `--outfile=${dir}/cards.mjs`,
  "--log-level=warning",
]);
execFileSync("node", [`${dir}/cards.mjs`, dir]);
const files = JSON.parse(readFileSync(join(dir, "cards.json"), "utf8"));

const browser = await chromium.launch();
// Reduced motion holds each Rafeeq in its pose, as the art lab does.
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
for (const file of files) {
  await page.goto(`file://${join(dir, file.replace(/\.png$/, ".html"))}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `public/og/${file}` });
  console.log(`public/og/${file}`);
}
await browser.close();
