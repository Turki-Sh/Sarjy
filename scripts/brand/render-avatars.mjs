// Renders the profile pictures from Turki's three paintings (docs/brand/art/). Run once after the
// art changes:   node scripts/brand/render-avatars.mjs
// Writes public/avatars/*.webp (committed): a square crop around each painting's subject, 256 px.

import { createRequire } from "node:module";

// sharp comes with Next.js; borrow it rather than adding a dependency for a one-off script.
const require = createRequire(createRequire(import.meta.url).resolve("next/package.json"));
const sharp = require("sharp");

// Square crops in the original pixels, chosen by eye around each subject.
const CROPS = {
  "rider-at-rest": { left: 370, top: 260, size: 760 }, // the resting rider, with the whole mark beside him
  falconer: { left: 530, top: 230, size: 750 }, // the rider and the raised falcon, both in frame
  "the-ride": { left: 300, top: 520, size: 800 }, // the horsemen mid-gallop
};

for (const [name, { left, top, size }] of Object.entries(CROPS)) {
  await sharp(`docs/brand/art/${name}.png`)
    .extract({ left, top, width: size, height: size })
    .resize(256, 256)
    .webp({ quality: 82 })
    .toFile(`public/avatars/${name}.webp`);
  console.log(`public/avatars/${name}.webp`);
}
