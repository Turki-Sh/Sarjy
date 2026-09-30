// Renders the Rafeeq art lab (lab-entry.ts) to a PNG, for looking at the companions while
// drawing them. Usage: node scripts/rafeeq/lab.mjs out.png [ids] [poses] [light|dark]
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const [, , png = "rafeeq-lab.png", ids = "", poses = "", theme = "light"] = process.argv;
const dir = mkdtempSync(join(tmpdir(), "rafeeq-"));
execFileSync("node_modules/.bin/esbuild", [
  "scripts/rafeeq/lab-entry.ts",
  "--bundle",
  "--platform=node",
  "--format=esm",
  `--outfile=${dir}/lab.mjs`,
  "--log-level=warning",
]);
const html = join(dir, "lab.html");
execFileSync("node", [`${dir}/lab.mjs`, html, ids, poses]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1320, height: 400 }, reducedMotion: "reduce" });
await page.goto(`file://${html}`);
if (theme === "dark") await page.evaluate(() => (document.documentElement.dataset.theme = "dark"));
await page.waitForTimeout(300);
await page.screenshot({ path: png, fullPage: true });
await browser.close();
