// Renders the app icons from the brand favicon (src/app/icon.svg). Run once after the mark changes:
//   node scripts/brand/render-icons.mjs
// Writes public/icons/*.png, src/app/apple-icon.png and src/app/favicon.ico (all committed).
//
// App icon rule (visual identity, section 1): white symbol on a Saddle Green tile, symbol at 64% of the
// tile width. Maskable and Apple icons are full-bleed squares, because the platform applies its own mask.

import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const root = new URL("../../", import.meta.url);
const symbol = readFileSync(new URL("src/app/icon.svg", root), "utf8").match(/d="([^"]+)"/)[1];
const GREEN = "#273B35";

// The symbol's drawn bounds inside its 224 x 152 viewBox, used to center it optically.
const B = { x: 13, y: 18, w: 198, h: 107 };

function tile({ size, rounded, symbolShare }) {
  const w = size * symbolShare;
  const scale = w / B.w;
  const x = (size - w) / 2 - B.x * scale;
  const y = (size - B.h * scale) / 2 - B.y * scale;
  const r = rounded ? size * 0.224 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" fill="${GREEN}"/>
    <path transform="translate(${x} ${y}) scale(${scale})" fill="#FFFFFF" d="${symbol}"/></svg>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();

async function png(svg, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  return page.locator("svg").screenshot({ omitBackground: true });
}

const out = {
  "public/icons/icon-192.png": [tile({ size: 192, rounded: true, symbolShare: 0.64 }), 192],
  "public/icons/icon-512.png": [tile({ size: 512, rounded: true, symbolShare: 0.64 }), 512],
  // Maskable: the symbol must sit inside the central 80% safe zone.
  "public/icons/maskable-512.png": [tile({ size: 512, rounded: false, symbolShare: 0.5 }), 512],
  "src/app/apple-icon.png": [tile({ size: 180, rounded: false, symbolShare: 0.6 }), 180],
};
for (const [file, [svg, size]] of Object.entries(out)) {
  writeFileSync(new URL(file, root), await png(svg, size));
}

// favicon.ico: an ICO container holding 16, 32 and 48 px PNGs (the format allows PNG entries).
const sizes = [16, 32, 48];
const images = [];
for (const s of sizes) images.push(await png(tile({ size: s, rounded: true, symbolShare: 0.7 }), s));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(images[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
writeFileSync(new URL("src/app/favicon.ico", root), Buffer.concat([header, ...images]));

await browser.close();
console.log("icons written");
