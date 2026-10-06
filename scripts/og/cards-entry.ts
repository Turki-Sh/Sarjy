// The link-preview cards drawn from the app's own pieces (Day 5): the Majlis invite, the 404 and
// the voice screen, each in English and Arabic, each with the Rafeeqs in it (Turki: "keep pets in
// mind"). They sit beside Turki's illustrated cards in public/og/ and follow their layout: the
// logo at the top, a big line, a small line under it, a kicker at the bottom, a picture beside.
// Run: node scripts/og/render.mjs (it bundles this file, writes one page per card, and
// screenshots each at 1200 x 630). The Rafeeqs come from the same art modules as the app, posed
// with the app's own CSS, so a card shows them exactly as they look on screen.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ART } from "../../src/client/ui/rafeeq/art";
import { SYMBOL_PATH, WORDMARK_PATHS } from "../../src/shared/brand/marks";
import { expressionOf, PERSONALITIES, type Hover, type Mood, type RafeeqId } from "../../src/shared/rafeeq";

const [, , outDir] = process.argv;
const tokens = readFileSync("src/styles/tokens.css", "utf8");
// The Rafeeq's module CSS with its scoping removed, as the art lab does.
const rafeeqCss = readFileSync("src/client/ui/rafeeq/Rafeeq.module.css", "utf8").replace(
  /:global\(([^)]+)\)/g,
  "$1",
);
const figtree = (w: number) =>
  `url("file://${resolve(`node_modules/@fontsource/figtree/files/figtree-latin-${w}-normal.woff2`)}")`;

type Pose = { state?: string; mood?: Mood; hover?: Hover; flip?: boolean };

/** One Rafeeq, standing with its feet at (x, y) on the card, `size` pixels square. */
function rafeeq(id: RafeeqId, x: number, y: number, size: number, pose: Pose = {}) {
  const { state = "idle", mood = "none", hover = null, flip = false } = pose;
  const p = PERSONALITIES[id];
  const expr = expressionOf(id, mood, hover, state === "idle");
  const attrs = [
    `data-rafeeq="${id}"`,
    `data-state="${state}"`,
    `data-mood="${mood}"`,
    hover ? `data-hover="${hover}"` : "",
    expr ? `data-expr="${expr}"` : "",
    `data-temper="${p.temper}" data-pet="${p.pet}" data-fail="${p.fail}" data-purr`,
  ].join(" ");
  const place = `left:${x - size / 2}px;top:${y - size * 0.86}px;--orb-size:${size}px;--energy:${p.energy};--mouth:${state === "speaking" ? 0.7 : 0};--lvl:${state === "listening" ? 0.4 : 0}`;
  return `<div class="pet${flip ? " flip" : ""}" style="${place}"><div class="wrap" ${attrs}>
  <svg class="svg" viewBox="0 0 200 200"><g class="float">${ART[id](`${id}${x}${y}`)}</g>
    <g class="thought"><circle cx="84" cy="40" r="5"/><circle cx="100" cy="34" r="6"/><circle cx="116" cy="40" r="5"/></g>
    <g class="zzz"><text x="140" y="70">z</text><text x="152" y="54">z</text><text x="166" y="36">Z</text></g>
    <g class="hearts"><path d="M60 60 c-4 -6 -12 -2 -8 5 l8 8 l8 -8 c4 -7 -4 -11 -8 -5 Z"/><path d="M140 52 c-3 -5 -10 -2 -7 4 l7 7 l7 -7 c3 -6 -4 -9 -7 -4 Z"/><path d="M100 30 c-3 -5 -9 -2 -6 4 l6 6 l6 -6 c3 -6 -3 -9 -6 -4 Z"/></g>
    <g class="sparkles">${[
      [44, 70],
      [158, 76],
      [36, 128],
      [168, 132],
      [100, 36],
    ]
      .map(([sx, sy]) => `<path d="M${sx} ${sy! - 7} l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z"/>`)
      .join("")}</g>
  </svg></div></div>`;
}

/** The horizontal lockup, drawn from the brand's paths (never typed). */
const logo = `<svg class="logo" viewBox="0 0 538 166" role="img" aria-label="Sarjy"><g transform="translate(2 15) scale(.7)"><path d="${SYMBOL_PATH}"/></g><g transform="translate(182 12)">${WORDMARK_PATHS.map((d) => `<path d="${d}"/>`).join("")}</g></svg>`;

type Copy = { title: string; body: string; kicker: string };

function page(opts: {
  lang: "en" | "ar";
  bg: string;
  ink: string;
  copy: Copy;
  scene: string;
  extraCss?: string;
}) {
  const { lang, bg, ink, copy, scene, extraCss = "" } = opts;
  const ar = lang === "ar";
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600&family=JetBrains+Mono:wght@500&display=block">
<style>
@font-face{font-family:"Figtree";font-weight:400;src:${figtree(400)}}
@font-face{font-family:"Figtree";font-weight:600;src:${figtree(600)}}
@font-face{font-family:"Figtree";font-weight:700;src:${figtree(700)}}
${tokens}
${rafeeqCss}
html,body{margin:0}
.card{position:relative;width:1200px;height:630px;overflow:hidden;background:${bg};color:${ink};font-family:var(--font-ui)}
.logo{position:absolute;top:44px;${ar ? "right" : "left"}:56px;height:30px;fill:currentColor}
.copy{position:absolute;top:150px;${ar ? "right" : "left"}:56px;width:500px;${ar ? "text-align:right;direction:rtl" : ""}}
h1{margin:0;font:600 ${ar ? "68px/1.3 var(--font-ar)" : "82px/0.98 var(--font-ui)"};letter-spacing:${ar ? "0" : "-0.035em"}}
p{margin:28px 0 0;max-width:420px;font:400 ${ar ? "24px/1.6 var(--font-ar)" : "23px/1.4 var(--font-ui)"};opacity:.86;${ar ? "margin-right:0;margin-left:auto" : ""}}
.kicker{position:absolute;bottom:40px;${ar ? "right" : "left"}:56px;font:500 13px/1 ${ar ? "var(--font-ar)" : "var(--font-data)"};letter-spacing:${ar ? "0" : "0.1em"};text-transform:uppercase;opacity:.8;${ar ? "direction:rtl" : ""}}
.scene{position:absolute;inset:0}
.pet{position:absolute}
.pet.flip{transform:scaleX(-1)}
.pet .wrap{--text-2:${ink}}
.aura{display:none}
${extraCss}
</style></head><body><div class="card">
<div class="scene">${scene}</div>
${logo}
<div class="copy"><h1>${copy.title}</h1><p>${copy.body}</p></div>
<div class="kicker">${copy.kicker}</div>
</div></body></html>`;
}

// ---- The Majlis: eight Rafeeqs on eight cushions around one finjan, the way a Majlis seats up
// to eight people around Sarjy. Each cushion is a seat color, as in the app.

const finjan = (
  cx: number,
  cy: number,
) => `<svg class="finjan" style="left:${cx - 143}px;top:${cy - 195}px" width="286" height="260" viewBox="0 0 220 200">
  <ellipse cx="110" cy="170" rx="104" ry="24" fill="var(--brass-dark)"/>
  <ellipse cx="110" cy="164" rx="104" ry="24" fill="var(--brass)"/>
  <ellipse cx="110" cy="162" rx="88" ry="17" fill="var(--brass-light)"/>
  <path d="M66 92 h88 l-10 56 q-34 10 -68 0 Z" fill="var(--white)" stroke="var(--saddle)" stroke-width="4" stroke-linejoin="round"/>
  <path d="M70 108 q40 10 80 0" fill="none" stroke="var(--sadu-red)" stroke-width="4"/>
  <ellipse cx="110" cy="92" rx="44" ry="9" fill="var(--brass)" stroke="var(--saddle)" stroke-width="4"/>
  <path d="M94 74 q-12 -16 0 -30 q12 -14 0 -30 M124 74 q-12 -16 0 -30 q12 -14 0 -30" fill="none" stroke="var(--white)" stroke-width="5" stroke-linecap="round" opacity=".9"/>
</svg>`;

/** A woven Sadu band along the floor, the pattern of the rugs in a majlis. */
const sadu = (
  y: number,
) => `<svg class="rug" style="top:${y}px" width="1200" height="${630 - y}" viewBox="0 0 1200 ${630 - y}" preserveAspectRatio="none">
  <rect width="1200" height="${630 - y}" fill="var(--sadu-red)"/>
  <rect y="10" width="1200" height="8" fill="var(--sadu-dark)"/>
  <path d="${Array.from({ length: 41 }, (_, i) => `M${i * 30} 46 l15 -18 l15 18 Z`).join(" ")}" fill="var(--sadu-cream)"/>
  <path d="${Array.from({ length: 41 }, (_, i) => `M${i * 30 + 15} 28 l15 18 l-30 0 Z`).join(" ")}" fill="var(--sadu-orange)" opacity=".9"/>
  <rect y="52" width="1200" height="8" fill="var(--sadu-dark)"/>
</svg>`;

const MAJLIS_SEATS: [RafeeqId, Pose][] = [
  ["drifter", { mood: "sleepy" }],
  ["keeper", { mood: "petted" }],
  ["rider", { mood: "happy" }],
  ["scout", { state: "listening" }],
  ["dune", { mood: "happy" }],
  ["lantern", { state: "speaking" }],
  ["fennec", { hover: "long", flip: true }],
  ["breeze", { mood: "happy", flip: true }],
];

/** `mirror` seats them the other way round, for the Arabic card (words on the right). */
function majlisScene(mirror: boolean) {
  const cx = mirror ? 1200 - 870 : 870;
  const cy = 575;
  const seats = MAJLIS_SEATS.map(([id, pose], i) => {
    // A gentle arc, open at the front like the cushions along a majlis's walls.
    const a = ((165 - (i * 150) / (MAJLIS_SEATS.length - 1)) * Math.PI) / 180;
    const x = cx + (mirror ? -260 : 260) * Math.cos(a);
    const y = cy - 230 * Math.sin(a);
    const size = 158 - 34 * Math.sin(a);
    const cushion = `<div class="cushion" style="left:${x - size * 0.42}px;top:${y - size * 0.1}px;width:${size * 0.84}px;height:${size * 0.24}px;background:var(--seat-${i + 1})"></div>`;
    return { y, html: cushion + rafeeq(id, x, y, size, { ...pose, flip: mirror !== !!pose.flip }) };
  });
  // The finjan sits in the middle of the circle. Far things first, so nearer ones overlap them.
  const things = [...seats, { y: cy - 60, html: finjan(cx, cy - 60) }];
  return (
    sadu(592) +
    things
      .sort((a, b) => a.y - b.y)
      .map((t) => t.html)
      .join("")
  );
}

const majlisCss = `.kicker{bottom:58px}
.cushion{position:absolute;border-radius:50%;box-shadow:inset 0 -6px 0 rgb(0 0 0 / .14)}
.finjan,.rug{position:absolute}`;

// ---- The 404: night in the dunes, the moon for the zero, and a few Rafeeqs who are no help.

const stars = Array.from({ length: 70 }, (_, i) => {
  // A fixed scatter (no randomness, so the card renders the same every time).
  const x = (i * 397) % 1200;
  const y = (i * 151) % 360;
  const r = 1 + ((i * 7) % 3) * 0.6;
  return `<circle cx="${x}" cy="${y}" r="${r}" opacity="${0.35 + ((i * 13) % 5) / 10}"/>`;
}).join("");

/** The map Fennec is holding, upside down: north points at the sand. */
const map = (
  x: number,
  y: number,
) => `<svg class="map" style="left:${x}px;top:${y}px" width="120" height="86" viewBox="0 0 120 86">
  <g transform="rotate(176 60 43)">
    <path d="M4 8 l36 -6 l40 6 l36 -6 v74 l-36 6 l-40 -6 l-36 6 Z" fill="var(--sadu-cream)" stroke="var(--sadu-dark)" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M40 2 v74 M80 8 v74" stroke="var(--plush-cream-deep)" stroke-width="2"/>
    <path d="M18 60 q20 -30 44 -14 t40 -26" fill="none" stroke="var(--sadu-red)" stroke-width="3" stroke-dasharray="5 5" stroke-linecap="round"/>
    <path d="M94 14 l10 10 M104 14 l-10 10" stroke="var(--sadu-red)" stroke-width="4" stroke-linecap="round"/>
    <path d="M22 34 v-16 l-6 8 M22 18 l6 8" fill="none" stroke="var(--sadu-dark)" stroke-width="2.5" stroke-linecap="round"/>
    <text x="17" y="46" font-family="Figtree" font-weight="700" font-size="12" fill="var(--sadu-dark)">N</text>
  </g>
</svg>`;

function lostScene(ar: boolean) {
  // The digits sit opposite the words; the moon is the zero.
  const side = ar ? 70 : 640;
  return `<svg class="sky" width="1200" height="630"><g fill="var(--white)">${stars}</g></svg>
  <div class="digits" style="left:${side}px" dir="ltr"><span>4</span><i class="moon"></i><span>4</span></div>
  <svg class="dunes" width="1200" height="630" viewBox="0 0 1200 630">
    <path d="M0 470 C180 420 330 410 520 446 C700 480 820 420 1000 412 C1100 408 1160 430 1200 440 V630 H0 Z" fill="var(--dune-shade)"/>
    <path d="M0 540 C220 500 420 500 640 528 C840 552 1000 506 1200 516 V630 H0 Z" fill="var(--dune-body)"/>
  </svg>
  ${rafeeq("scout", side + 70, 470, 140, { state: "thinking" })}
  ${rafeeq("drifter", side + 480, 436, 130, { mood: "sleepy" })}
  ${rafeeq("fennec", side + 250, 560, 180, { mood: "none", hover: "near" })}
  ${map(side + 318, 478)}
  ${rafeeq("lantern", side + 470, 590, 120, { mood: "happy", flip: true })}`;
}

const lostCss = `.sky,.dunes,.map{position:absolute;left:0;top:0}
.map{filter:drop-shadow(0 4px 0 rgb(0 0 0 / .18))}
.digits{position:absolute;top:96px;display:flex;align-items:center;gap:6px;font:700 210px/1 var(--font-ui);color:var(--dusk-light);letter-spacing:-0.04em}
.moon{display:block;width:170px;height:170px;margin:0 10px;border-radius:50%;background:radial-gradient(circle at 36% 34%, var(--lantern-core), var(--brass-light) 62%, var(--brass) 100%);box-shadow:0 0 60px color-mix(in srgb, var(--lantern-core) 45%, transparent)}`;

// ---- The voice screen: the orb, with Rider beside it keeping what you just said.

const orb = (
  cx: number,
  cy: number,
  d: number,
) => `<svg class="orb" style="left:${cx - d / 2}px;top:${cy - d / 2}px" width="${d}" height="${d}" viewBox="0 0 400 400">
  <defs>
    <filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
    <radialGradient id="rim" cx="50%" cy="50%" r="50%"><stop offset="56%" stop-color="var(--white)" stop-opacity="0"/><stop offset="86%" stop-color="var(--white)" stop-opacity=".5"/><stop offset="100%" stop-color="var(--white)" stop-opacity=".95"/></radialGradient>
    <radialGradient id="spec" cx="38%" cy="16%" r="30%"><stop offset="0%" stop-color="var(--white)" stop-opacity=".9"/><stop offset="100%" stop-color="var(--white)" stop-opacity="0"/></radialGradient>
    <clipPath id="sphere"><circle cx="200" cy="200" r="172"/></clipPath>
  </defs>
  <circle cx="200" cy="214" r="172" fill="var(--saddle)" fill-opacity=".18" filter="url(#blur)"/>
  <circle cx="200" cy="200" r="172" fill="var(--white)"/>
  <g clip-path="url(#sphere)" filter="url(#blur)">
    <circle cx="150" cy="230" r="92" fill="var(--saffron)" fill-opacity=".85"/>
    <circle cx="250" cy="220" r="86" fill="var(--coral)" fill-opacity=".75"/>
    <circle cx="205" cy="130" r="82" fill="var(--dusk)" fill-opacity=".7"/>
  </g>
  <circle cx="200" cy="200" r="172" fill="url(#rim)"/>
  <ellipse cx="160" cy="80" rx="72" ry="34" fill="url(#spec)"/>
  <g transform="translate(88 124)" fill="var(--saddle)"><path d="${SYMBOL_PATH}"/></g>
</svg>`;

function talkScene(ar: boolean, bubble: string) {
  const cx = ar ? 380 : 870;
  return `${orb(cx, 285, 380)}
  ${rafeeq("rider", cx - 185, 572, 240, { mood: "happy" })}
  ${rafeeq("keeper", cx + 205, 584, 190, { mood: "petted", flip: true })}
  <div class="bubble" style="left:${cx - 345}px;top:318px" dir="${ar ? "rtl" : "ltr"}">${bubble}</div>`;
}

const talkCss = `.orb{position:absolute}
.bubble{position:absolute;padding:12px 20px;border-radius:22px 22px 22px 6px;background:var(--white);color:var(--saddle);font:600 24px/1.2 var(--font-ui);box-shadow:0 6px 0 rgb(0 0 0 / .12)}
.bubble[dir="rtl"]{font-family:var(--font-ar);border-radius:22px 22px 22px 6px}`;

// ---- The home page: the tagline, and all eight crossing the dunes as a caravan under a big sun,
// Rider leading (Turki, Day 5: the main card should match the others).

/** The caravan, front to back: who walks where along the ridge, and how. */
const CARAVAN: [RafeeqId, Pose][] = [
  ["rider", { mood: "happy" }],
  ["dune", { state: "speaking" }],
  ["keeper", { mood: "petted" }],
  ["fennec", { hover: "near" }],
  ["scout", { state: "listening" }],
  ["lantern", { mood: "happy" }],
  ["breeze", { mood: "happy" }],
  ["drifter", { mood: "sleepy" }],
];

/** The near ridge's height at x: flat under the words, rising into a long hump under the caravan. */
const ridgeAt = (x: number) => 530 - 52 * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - 360) / 900)));

function homeScene(mirror: boolean) {
  const at = (x: number) => (mirror ? 1200 - x : x);
  const walkers = CARAVAN.map(([id, pose], i) => {
    // Rider in front, nearest the words; each one behind a little further back and smaller.
    const x = 606 + i * 74;
    const size = 150 - i * 8;
    const y = ridgeAt(x) + 14;
    // They walk toward the words, so each faces them.
    return rafeeq(id, at(x), y, size, { ...pose, flip: !mirror !== !!pose.flip });
  }).reverse();
  const ridge = Array.from({ length: 61 }, (_, i) => {
    const x = i * 20;
    return `${i ? "L" : "M"}${at(x)} ${ridgeAt(x)}`;
  }).join(" ");
  return `<svg class="sky" width="1200" height="630" viewBox="0 0 1200 630">
    <circle cx="${at(930)}" cy="300" r="190" fill="var(--saffron)" opacity=".18"/>
    <circle cx="${at(930)}" cy="300" r="150" fill="var(--saffron)" opacity=".35"/>
    <circle cx="${at(930)}" cy="300" r="112" fill="var(--brass-light)"/>
    <path d="M0 470 C200 430 360 420 560 448 C760 476 900 412 1200 420 V630 H0 Z" fill="var(--dune-light)" opacity=".75"/>
    <path d="${ridge} L${at(1200)} 630 L${at(0)} 630 Z" fill="var(--dune-body)"/>
    <path d="M0 560 C240 528 520 540 760 566 C960 586 1080 560 1200 552 V630 H0 Z" fill="var(--dune-shade)"/>
    <path d="${Array.from({ length: 8 }, (_, i) => `M${at(566 + i * 74)} ${ridgeAt(566 + i * 74) + 24} q8 -3 16 0`).join(" ")}" stroke="var(--dune-shade)" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>
  </svg>
  ${walkers.join("")}`;
}

const homeCss = `.sky{position:absolute;left:0;top:0}`;

// ---- The film: an open-air screening in the dunes at night. The screen shows the orb, glowing,
// and five of them sit on cushions in front of it (one has fallen asleep already).

/** The screen on its two poles: a frame of wood, the orb on it, a progress bar under it. */
function screen(x: number, y: number, w: number) {
  const h = Math.round((w * 9) / 16);
  return `<svg class="screen" style="left:${x - 14}px;top:${y - 14}px" width="${w + 28}" height="${h + 250}" viewBox="0 0 ${w + 28} ${h + 250}">
    <rect x="22" y="${h + 20}" width="12" height="230" rx="4" fill="var(--wood-dark)"/>
    <rect x="${w - 6}" y="${h + 20}" width="12" height="230" rx="4" fill="var(--wood-dark)"/>
    <rect x="0" y="0" width="${w + 28}" height="${h + 28}" rx="16" fill="var(--wood)"/>
    <rect x="14" y="14" width="${w}" height="${h}" rx="6" fill="var(--sky-night-low)"/>
    <rect x="${14 + w * 0.08}" y="${h - 18}" width="${w * 0.84}" height="6" rx="3" fill="var(--white)" opacity=".28"/>
    <rect x="${14 + w * 0.08}" y="${h - 18}" width="${w * 0.3}" height="6" rx="3" fill="var(--saffron)"/>
    <circle cx="${14 + w * 0.38}" cy="${h - 15}" r="9" fill="var(--white)"/>
  </svg>`;
}

/** A striped popcorn box, the way the cinema ones look. */
const popcorn = (
  x: number,
  y: number,
) => `<svg class="popcorn" style="left:${x}px;top:${y}px" width="58" height="74" viewBox="0 0 58 74">
  <g fill="var(--plush-cream-light)" stroke="var(--plush-cream-deep)" stroke-width="1.5">
    <circle cx="12" cy="20" r="9"/><circle cx="26" cy="13" r="10"/><circle cx="41" cy="18" r="9"/><circle cx="20" cy="24" r="8"/><circle cx="35" cy="25" r="8"/>
  </g>
  <path d="M5 28 h48 l-6 44 h-36 Z" fill="var(--white)" stroke="var(--saddle)" stroke-width="3" stroke-linejoin="round"/>
  <path d="M15 28 l3 44 M29 28 v44 M43 28 l-3 44" stroke="var(--sadu-red)" stroke-width="6"/>
</svg>`;

/** Who came to the screening, left to right, and how they are taking it. */
const AUDIENCE: [RafeeqId, Pose, number][] = [
  ["rider", { mood: "happy" }, 132],
  ["keeper", { mood: "petted" }, 124],
  ["fennec", { hover: "near" }, 128],
  ["drifter", { mood: "sleepy" }, 112],
  ["lantern", { state: "speaking" }, 112],
];

function filmScene(mirror: boolean) {
  const at = (x: number) => (mirror ? 1200 - x : x);
  // The picture on the screen: where it sits, and how big.
  const w = 442;
  const h = Math.round((w * 9) / 16);
  const left = mirror ? 1200 - 654 - w : 654;
  const top = 94;
  const seats = AUDIENCE.map(([id, pose, size], i) => {
    const x = 636 + i * 118;
    const y = 572;
    const cushion = `<div class="cushion" style="left:${at(x) - size * 0.42}px;top:${y - size * 0.1}px;width:${size * 0.84}px;height:${size * 0.24}px;background:var(--seat-${i + 2})"></div>`;
    return cushion + rafeeq(id, at(x), y, size, { ...pose, flip: mirror !== !!pose.flip });
  });
  return `<svg class="sky" width="1200" height="630" viewBox="0 0 1200 630">
    <defs><linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky-night-top)"/><stop offset="1" stop-color="var(--sky-night-low)"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#night)"/>
    <g fill="var(--star)">${stars}</g>
    <path d="M0 500 C200 470 380 466 600 488 C820 510 980 470 1200 478 V630 H0 Z" fill="var(--sand-night-far)"/>
    <path d="M0 560 C240 536 520 540 760 556 C960 570 1080 550 1200 546 V630 H0 Z" fill="var(--sand-night-mid)"/>
  </svg>
  ${screen(left, top, w)}
  ${orb(left + w / 2, top + h / 2 - 10, 180)}
  ${seats.join("")}
  ${popcorn(at(700) - 29, 530)}`;
}

const filmCss = `.sky{position:absolute;left:0;top:0}
.screen,.popcorn,.orb{position:absolute}
.screen{filter:drop-shadow(0 0 48px color-mix(in srgb, var(--sky-night-low) 90%, var(--frost)))}
.cushion{position:absolute;border-radius:50%;box-shadow:inset 0 -6px 0 rgb(0 0 0 / .18)}`;

// ---- End of Winter: the second film's own card. A winter night in the desert, the last light
// still on the horizon behind the rocks, a fire with the dallah warming on its coals and a finjan
// poured, the way the film goes. Lantern (who answers in the film) keeps the fire company, and
// Keeper, who keeps what you tell it, sits on the Sadu cushion with the cup.

const FLAME = "M50 100 C22 96 18 70 32 50 C40 38 44 24 50 4 C58 24 70 36 76 54 C84 76 76 96 50 100 Z";

/** The fire: crossed logs on a ring of stones, three flames inside each other, sparks rising. */
const fire = (cx: number, base: number, w: number) => {
  // A few sparks just above the flames, drifting apart as they rise.
  const sparks = [
    [-8, -30, 2.6],
    [12, -48, 2.2],
    [-20, -66, 1.8],
    [22, -82, 1.6],
    [2, -104, 1.4],
    [-14, -126, 1.2],
  ]
    .map(([dx, dy, r]) => `<circle cx="${50 + dx!}" cy="${dy}" r="${r}"/>`)
    .join("");
  return `<svg class="fire" style="left:${cx - w / 2}px;top:${base - w * 2.4}px" width="${w}" height="${w * 2.5}" viewBox="0 -140 100 250">
    <g fill="var(--ember)">${sparks}</g>
    <path d="${FLAME}" fill="var(--fire-edge)"/>
    <g transform="translate(50 100) scale(0.74) translate(-50 -100)"><path d="${FLAME}" fill="var(--fire-mid)"/></g>
    <g transform="translate(50 100) scale(0.44 0.52) translate(-50 -100)"><path d="${FLAME}" fill="var(--fire-core)"/></g>
    <rect x="12" y="88" width="76" height="10" rx="5" transform="rotate(-12 50 93)" fill="var(--wood)"/>
    <rect x="12" y="88" width="76" height="10" rx="5" transform="rotate(12 50 93)" fill="var(--wood-dark)"/>
    <g fill="var(--stone)"><ellipse cx="8" cy="102" rx="9" ry="5"/><ellipse cx="28" cy="105" rx="10" ry="5"/><ellipse cx="50" cy="106" rx="10" ry="5"/><ellipse cx="72" cy="105" rx="10" ry="5"/><ellipse cx="92" cy="102" rx="9" ry="5"/></g>
  </svg>`;
};

/** A brass dallah, standing at (x, base): the coffee pot with its long beak and crowned lid. */
const dallah = (
  x: number,
  base: number,
  h: number,
) => `<svg class="dallah" style="left:${x - h * 0.55}px;top:${base - h}px" width="${h * 1.1}" height="${h}" viewBox="0 0 110 100">
  <path d="M38 98 h34 l-4 -8 q-2 -14 4 -26 q6 -12 -2 -22 h-30 q-8 10 -2 22 q6 12 4 26 Z" fill="var(--brass)" stroke="var(--brass-dark)" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M41 42 q14 -6 28 0 l-3 -10 q-11 -4 -22 0 Z" fill="var(--brass-light)" stroke="var(--brass-dark)" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M50 32 q5 -14 10 0" fill="var(--brass-light)" stroke="var(--brass-dark)" stroke-width="2.5"/>
  <circle cx="55" cy="16" r="4" fill="var(--brass-light)" stroke="var(--brass-dark)" stroke-width="2"/>
  <path d="M40 58 q-18 -4 -26 -26 q-2 -6 -10 -8" fill="none" stroke="var(--brass-dark)" stroke-width="7" stroke-linecap="round"/>
  <path d="M40 58 q-18 -4 -26 -26 q-2 -6 -10 -8" fill="none" stroke="var(--brass)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M70 46 q22 6 14 34 q-3 8 -12 10" fill="none" stroke="var(--brass-dark)" stroke-width="5" stroke-linecap="round"/>
  <path d="M44 80 h22" stroke="var(--brass-light)" stroke-width="2" opacity=".7"/>
</svg>`;

/** A Sadu cushion, the woven kind on the rug in the film. */
const cushionSadu = (
  x: number,
  y: number,
  w: number,
) => `<svg class="sadu-cushion" style="left:${x - w / 2}px;top:${y - w * 0.32}px" width="${w}" height="${w * 0.4}" viewBox="0 0 100 40">
  <rect x="2" y="4" width="96" height="32" rx="8" fill="var(--sadu-red)" stroke="var(--sadu-dark)" stroke-width="2"/>
  <path d="${Array.from({ length: 8 }, (_, i) => `M${8 + i * 12} 26 l6 -10 l6 10 Z`).join(" ")}" fill="var(--sadu-cream)"/>
  <rect x="2" y="9" width="96" height="3" fill="var(--sadu-dark)"/>
  <rect x="2" y="29" width="96" height="3" fill="var(--sadu-dark)"/>
</svg>`;

function winterScene(mirror: boolean) {
  const at = (x: number) => (mirror ? 1200 - x : x);
  // The rocks on the horizon, as in the film's first shots: low, broken, dark against the glow.
  const rocks = [
    [520, 120, 44],
    [620, 150, 70],
    [790, 90, 38],
    [990, 170, 84],
    [1130, 110, 52],
  ]
    .map(([x, w, h]) => {
      // A mesa: steep sides, a broken flat top.
      const pts = [
        [0, 0],
        [0.1, 0.62],
        [0.2, 1],
        [0.42, 0.94],
        [0.6, 1],
        [0.78, 0.8],
        [0.9, 0.46],
        [1, 0],
      ].map(([u, v]) => `${at(x! + u! * w!)},${472 - v! * h!}`);
      return `<polygon points="${pts.join(" ")}" fill="var(--sand-night-shade)"/>`;
    })
    .join("");
  const fx = at(860);
  return `<svg class="sky" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="winter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky-night-top)"/><stop offset=".55" stop-color="var(--sky-night-low)"/><stop offset=".76" stop-color="var(--sky-dusk-top)"/><stop offset=".86" stop-color="var(--sky-dusk-low)"/></linearGradient>
      <radialGradient id="glow" cx="${fx / 12}%" cy="88%" r="34%"><stop offset="0" stop-color="var(--fire-glow)"/><stop offset="1" stop-color="var(--fire-glow)" stop-opacity="0"/></radialGradient>
      <filter id="haze"><feGaussianBlur stdDeviation="18"/></filter>
    </defs>
    <rect width="1200" height="630" fill="url(#winter)"/>
    <path d="M${at(1240)} -40 L${at(380)} 470" stroke="var(--star)" stroke-width="90" opacity=".08" filter="url(#haze)"/>
    <g fill="var(--star)">${stars}</g>
    ${rocks}
    <path d="M0 470 C200 462 400 466 600 470 C800 474 1000 466 1200 468 V630 H0 Z" fill="var(--sand-night-near)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
  </svg>
  ${rafeeq("lantern", at(730), 590, 150, { mood: "happy", flip: mirror })}
  ${fire(fx, 584, 92)}
  ${dallah(at(948), 584, 74)}
  ${cushionSadu(at(1080), 586, 150)}
  ${rafeeq("keeper", at(1080), 566, 150, { mood: "petted", flip: !mirror })}
  <svg class="finjan-cup" style="left:${at(1008) - 13}px;top:568px" width="26" height="22" viewBox="0 0 26 22"><path d="M2 3 h22 l-3 15 q-8 4 -16 0 Z" fill="var(--white)" stroke="var(--saddle)" stroke-width="2"/><path d="M4 7 h18" stroke="var(--fire-mid)" stroke-width="3"/></svg>`;
}

const winterCss = `.sky{position:absolute;left:0;top:0}
.fire,.dallah,.sadu-cushion,.finjan-cup{position:absolute}
.fire{filter:drop-shadow(0 0 26px var(--fire-glow))}`;

// ---- Sarjy, in a minute: the first film's own card. A bright day on the dunes, the orb, and a
// brass hourglass running beside it (the whole of Sarjy in one minute), with Rider keeping an eye
// on the sand and Breeze drifting by.

/** A brass hourglass with sand running from the top bulb to a heap in the bottom one. */
const hourglass = (
  cx: number,
  base: number,
  h: number,
) => `<svg class="hourglass" style="left:${cx - h * 0.32}px;top:${base - h}px" width="${h * 0.64}" height="${h}" viewBox="0 0 64 100">
  <rect x="4" y="2" width="56" height="8" rx="3" fill="var(--brass)" stroke="var(--brass-dark)" stroke-width="2"/>
  <rect x="4" y="90" width="56" height="8" rx="3" fill="var(--brass)" stroke="var(--brass-dark)" stroke-width="2"/>
  <path d="M12 10 C12 34 28 42 30 50 C28 58 12 66 12 90 H52 C52 66 36 58 34 50 C36 42 52 34 52 10 Z" fill="var(--white)" fill-opacity=".55" stroke="var(--brass-dark)" stroke-width="2.5"/>
  <path d="M19 28 C24 38 30 44 32 48 C34 44 40 38 45 28 Z" fill="var(--dune-body)"/>
  <path d="M32 50 V84" stroke="var(--dune-body)" stroke-width="2" stroke-dasharray="3 3"/>
  <path d="M16 88 C20 76 28 72 32 72 C36 72 44 76 48 88 Z" fill="var(--dune-body)"/>
  <path d="M8 10 V90 M56 10 V90" stroke="var(--brass-dark)" stroke-width="3"/>
</svg>`;

function minuteScene(mirror: boolean) {
  const at = (x: number) => (mirror ? 1200 - x : x);
  return `<svg class="sky" width="1200" height="630" viewBox="0 0 1200 630">
    <defs><linearGradient id="day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky-day-top)"/><stop offset="1" stop-color="var(--sky-day-low)"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#day)"/>
    <path d="M0 500 C200 470 380 466 600 488 C820 510 980 470 1200 478 V630 H0 Z" fill="var(--dune-light)"/>
    <path d="M0 556 C240 532 520 536 760 552 C960 566 1080 546 1200 542 V630 H0 Z" fill="var(--dune-body)"/>
  </svg>
  ${orb(at(870), 270, 320)}
  ${hourglass(at(1080), 560, 170)}
  ${rafeeq("rider", at(690), 584, 190, { mood: "happy", flip: mirror })}
  ${rafeeq("breeze", at(1000), 250, 96, { mood: "happy", flip: !mirror })}`;
}

const minuteCss = `.sky{position:absolute;left:0;top:0}
.orb,.hourglass{position:absolute}
.orb{overflow:visible}
.hourglass{filter:drop-shadow(0 8px 0 rgb(0 0 0 / .1))}`;

// ---- The Star in the Well: the third film's own card (docs/brand/lore). Night in the dunes under
// the Straw Road, an old stone well alone on the sand with light pouring up out of it and the little
// star peeking over the rim; Fennec, ears up, heard it first, and Keeper has brought a rope, just in case.

/** A five-pointed star with the Rafeeqs' small smile, centered at (cx, cy). */
const littleStar = (cx: number, cy: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.5 : r;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(" ");
  return `<polygon points="${pts}" fill="var(--lantern-core)" stroke="var(--brass-light)" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="${cx - r * 0.18}" cy="${cy - r * 0.02}" r="${r * 0.07}" fill="var(--saddle)"/>
    <circle cx="${cx + r * 0.18}" cy="${cy - r * 0.02}" r="${r * 0.07}" fill="var(--saddle)"/>
    <path d="M${cx - r * 0.12} ${cy + r * 0.14} q${r * 0.06} ${r * 0.08} ${r * 0.12} 0 q${r * 0.06} ${r * 0.08} ${r * 0.12} 0" fill="none" stroke="var(--saddle)" stroke-width="2.5" stroke-linecap="round"/>`;
};

function wellScene(mirror: boolean) {
  const at = (x: number) => (mirror ? 1200 - x : x);
  const wx = at(870);
  const top = 470;
  // The well's stones: a ring of rounded blocks around the mouth.
  const stones = Array.from({ length: 9 }, (_, i) => {
    const x = wx - 120 + i * 30;
    return `<rect x="${x - 14}" y="${top + 2 + (i % 2) * 22}" width="28" height="20" rx="6" fill="var(${i % 3 ? "--stone" : "--stone-light"})" stroke="var(--sand-night-shade)" stroke-width="2"/>`;
  }).join("");
  return `<svg class="sky" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky-night-top)"/><stop offset="1" stop-color="var(--sky-night-low)"/></linearGradient>
      <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--lantern-core)" stop-opacity=".85"/><stop offset="1" stop-color="var(--lantern-core)" stop-opacity="0"/></linearGradient>
      <filter id="haze"><feGaussianBlur stdDeviation="18"/></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <rect width="1200" height="630" fill="url(#deep)"/>
    <path d="M${at(1240)} -40 L${at(300)} 430" stroke="var(--star)" stroke-width="110" opacity=".1" filter="url(#haze)"/>
    <path d="M${at(1180)} -20 L${at(420)} 380" stroke="var(--brass-light)" stroke-width="18" opacity=".18" filter="url(#haze)"/>
    <g fill="var(--star)">${stars}</g>
    <path d="M0 456 C200 430 380 440 600 452 C820 464 1000 432 1200 440 V630 H0 Z" fill="var(--sand-night-far)"/>
    <path d="M0 540 C240 516 520 520 760 536 C960 550 1080 528 1200 524 V630 H0 Z" fill="var(--sand-night-mid)"/>
    <path d="M${wx - 70} ${top + 6} L${wx - 150} 40 L${wx + 150} 40 L${wx + 70} ${top + 6} Z" fill="url(#beam)" opacity=".55" filter="url(#soft)"/>
    <ellipse cx="${wx}" cy="${top + 4}" rx="128" ry="26" fill="var(--sand-night-shade)"/>
    <ellipse cx="${wx}" cy="${top + 2}" rx="104" ry="18" fill="var(--lantern-core)" opacity=".85" filter="url(#soft)"/>
    ${littleStar(wx + 10, top - 34, 44)}
    <rect x="${wx - 130}" y="${top}" width="260" height="66" rx="14" fill="var(--stone)"/>
    ${stones}
    <path d="M${wx - 118} ${top - 4} V${top - 120} M${wx + 118} ${top - 4} V${top - 120} M${wx - 132} ${top - 120} H${wx + 132}" stroke="var(--wood-dark)" stroke-width="12" stroke-linecap="round"/>
    <path d="M${wx + 40} ${top - 120} V${top - 30}" stroke="var(--sadu-cream)" stroke-width="4"/>
  </svg>
  ${rafeeq("fennec", at(700), 572, 150, { hover: "near", flip: mirror })}
  ${rafeeq("keeper", at(1070), 586, 150, { mood: "happy", flip: !mirror })}`;
}

const wellCss = `.sky{position:absolute;left:0;top:0}`;

// ---- Fennec's Travel Vlog: the fourth film's own card. A bright day on the dunes; the camel, "the
// desert's finest gentleman", leans in from the edge, half-lidded, and burps a cartoon cloud at
// Fennec, who grumbles. A REC badge says it is her vlog. Flat shapes with one dark outline, the
// burp in oasis green thinned with cream (the film draws it the same way).

function vlogScene(mirror: boolean) {
  const at = (x: number) => (mirror ? 1200 - x : x);
  const flipG = mirror ? ` transform="translate(1200 0) scale(-1 1)"` : "";
  const puff = (x: number, y: number, r: number) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--burp)"/><circle cx="${x - r * 0.22}" cy="${y - r * 0.24}" r="${r * 0.6}" fill="var(--burp-light)"/>`;
  return `<svg class="sky" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="vlogday" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky-day-top)"/><stop offset="1" stop-color="var(--sky-day-low)"/></linearGradient>
      <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="3.5" result="fat"/>
        <feFlood style="flood-color:var(--saddle)"/><feComposite in2="fat" operator="in" result="line"/>
        <feMerge><feMergeNode in="line"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="1200" height="630" fill="url(#vlogday)"/>
    <path d="M0 470 C220 440 420 452 640 470 C860 488 1020 452 1200 460 V630 H0 Z" fill="var(--dune-light)"/>
    <path d="M0 560 C240 534 520 540 760 556 C960 570 1080 548 1200 544 V630 H0 Z" fill="var(--dune-body)"/>
    <g${flipG}>
      <g filter="url(#ink)" fill="var(--seat-8)">
        <path d="M1150 640 C1128 520 1110 420 1092 330 L1180 300 C1200 400 1232 520 1262 640 Z"/>
        <ellipse cx="1078" cy="262" rx="90" ry="62" transform="rotate(-12 1078 262)"/>
        <ellipse cx="984" cy="300" rx="74" ry="46" transform="rotate(10 984 300)"/>
        <ellipse cx="1128" cy="200" rx="17" ry="30" transform="rotate(-28 1128 200)"/>
      </g>
      <ellipse cx="972" cy="302" rx="52" ry="32" fill="var(--camel-muzzle)" transform="rotate(10 972 302)"/>
      <path d="M930 318 Q964 356 1012 332 Q972 334 930 318 Z" fill="var(--saddle)"/>
      <path d="M946 322 h10 v9 h-10 Z M961 325 h10 v10 h-10 Z M976 326 h10 v9 h-10 Z" fill="var(--dune-cloth)" stroke="var(--saddle)" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M926 286 q6 -6 12 0" fill="none" stroke="var(--saddle)" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="1062" cy="246" rx="13" ry="10" fill="var(--saddle)"/>
      <path d="M1046 240 h32 v-9 h-32 Z" fill="var(--seat-8)"/>
      <path d="M1046 241 L1078 239" stroke="var(--saddle)" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M1012 262 Q996 312 1012 344 M1012 268 L1104 300" fill="none" stroke="var(--sadu-red)" stroke-width="8" stroke-linecap="round"/>
      <circle cx="1010" cy="300" r="7" fill="var(--sadu-red)" stroke="var(--saddle)" stroke-width="2"/>
      <g filter="url(#ink)">
        ${puff(928, 352, 26)}${puff(902, 378, 34)}${puff(940, 392, 24)}${puff(872, 408, 40)}${puff(908, 432, 30)}${puff(856, 448, 34)}
      </g>
    </g>
    <g fill="none" stroke-linecap="round">
      ${[0, 1, 2]
        .map((k) => {
          const x = at(752 + k * 46);
          const y = 388 - (k === 1 ? 16 : 0);
          const d = `M${x} ${y} q10 -14 0 -28 q-10 -14 0 -28`;
          return `<path d="${d}" stroke="var(--saddle)" stroke-width="11"/><path d="${d}" stroke="var(--burp)" stroke-width="5"/>`;
        })
        .join("")}
    </g>
  </svg>
  ${rafeeq("fennec", at(800), 592, 210, { mood: "grumble", flip: mirror })}
  <div class="rec"><i></i>REC</div>`;
}

const vlogCss = (mirror: boolean) => `.sky{position:absolute;left:0;top:0}
.card{--burp:color-mix(in srgb, var(--oasis) 45%, var(--dune-cloth));--burp-light:color-mix(in srgb, var(--oasis) 18%, var(--white));--camel-muzzle:color-mix(in srgb, var(--seat-8) 70%, var(--dune-cloth))}
.rec{position:absolute;top:40px;${mirror ? "left" : "right"}:56px;display:flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;background:color-mix(in srgb, var(--white) 82%, transparent);font:500 15px/1 var(--font-data);letter-spacing:.1em;color:var(--saddle)}
.rec i{width:11px;height:11px;border-radius:50%;background:var(--coral)}`;

// ---- The cards. File names say what each one shows, like Turki's.

export const CARDS = [
  {
    file: "home-shaped-to-its-rider.png",
    html: page({
      lang: "en",
      bg: "var(--coral)",
      ink: "var(--saddle)",
      copy: {
        title: "Shaped to its rider.",
        body: "A voice assistant that remembers what you tell it, in English and Saudi Arabic. And it brings a friend.",
        kicker: "Sarjy / A voice assistant",
      },
      scene: homeScene(false),
      extraCss: homeCss,
    }),
  },
  {
    file: "home-ala-maqas-farisah.png",
    html: page({
      lang: "ar",
      bg: "var(--coral)",
      ink: "var(--saddle)",
      copy: {
        title: "على مقاس فارسه.",
        body: "مساعد صوتي يتذكر اللي تقوله، بالعربي والإنجليزي. ومعه رفيق.",
        kicker: "سرجي · مساعد صوتي",
      },
      scene: homeScene(true),
      extraCss: homeCss,
    }),
  },
  {
    file: "majlis-pull-up-a-cushion.png",
    html: page({
      lang: "en",
      bg: "var(--saffron)",
      ink: "var(--saddle)",
      copy: {
        title: "Pull up a cushion.",
        body: "You're invited to a Majlis: one Sarjy, up to eight of you, each from your own phone.",
        kicker: "Sarjy / A Majlis invite",
      },
      scene: majlisScene(false),
      extraCss: majlisCss,
    }),
  },
  {
    file: "majlis-hayyak.png",
    html: page({
      lang: "ar",
      bg: "var(--saffron)",
      ink: "var(--saddle)",
      copy: {
        title: "حيّاك، المجلس عامر.",
        body: "معزوم على مجلس: سرجي واحد، ولين ثمانية منكم، كل واحد من جواله.",
        kicker: "سرجي · دعوة لمجلس",
      },
      scene: majlisScene(true),
      extraCss: majlisCss,
    }),
  },
  {
    file: "lost-not-a-real-page.png",
    html: page({
      lang: "en",
      bg: "var(--dusk)",
      ink: "var(--white)",
      copy: {
        title: "This page isn't real.",
        body: "We looked everywhere. So did the Rafeeqs. Fennec is holding the map upside down.",
        kicker: "404 / Nowhere in particular",
      },
      scene: lostScene(false),
      extraCss: lostCss,
    }),
  },
  {
    file: "lost-mo-mawjouda.png",
    html: page({
      lang: "ar",
      bg: "var(--dusk)",
      ink: "var(--white)",
      copy: {
        title: "هالصفحة مو موجودة أصلًا.",
        body: "دوّرنا عليها في كل مكان، والرفقاء معنا. وفنك ماسك الخريطة بالمقلوب.",
        kicker: "٤٠٤ · ولا مكان",
      },
      scene: lostScene(true),
      extraCss: lostCss,
    }),
  },
  {
    file: "talk-tell-it-once.png",
    html: page({
      lang: "en",
      bg: "var(--oasis)",
      ink: "var(--saddle)",
      copy: {
        title: "Tell it once.",
        body: "Talk to Sarjy in English or Saudi Arabic. It remembers, and shows you what it keeps.",
        kicker: "Sarjy / Talk",
      },
      scene: talkScene(false, "Noted."),
      extraCss: talkCss,
    }),
  },
  {
    file: "talk-qulha-marra.png",
    html: page({
      lang: "ar",
      bg: "var(--oasis)",
      ink: "var(--saddle)",
      copy: {
        title: "قلها مرة وحدة.",
        body: "كلّم سرجي بالعربي أو بالإنجليزي. يتذكر، ويوريك وش حفظ.",
        kicker: "سرجي · كلّمه",
      },
      scene: talkScene(true, "حفظتها."),
      extraCss: talkCss,
    }),
  },
  {
    file: "films-sarjy-films.png",
    html: page({
      lang: "en",
      bg: "var(--sky-night-top)",
      ink: "var(--frost)",
      copy: {
        title: "Sarjy films.",
        body: "Short films about Sarjy and the people it rides with. The Rafeeqs saved you a seat.",
        kicker: "Sarjy / Films",
      },
      scene: filmScene(false),
      extraCss: filmCss,
    }),
  },
  {
    file: "films-aflam-sarjy.png",
    html: page({
      lang: "ar",
      bg: "var(--sky-night-top)",
      ink: "var(--frost)",
      copy: {
        title: "أفلام سرجي.",
        body: "أفلام قصيرة عن سرجي واللي يمشي معهم. الرفقاء حاجزين لك مكان.",
        kicker: "سرجي · أفلام",
      },
      scene: filmScene(true),
      extraCss: filmCss,
    }),
  },
  {
    file: "film-sarjy-in-a-minute.png",
    html: page({
      lang: "en",
      bg: "var(--sky-day-low)",
      ink: "var(--saddle)",
      copy: {
        title: "Sarjy, in a minute.",
        body: "Tell it once, and it remembers. The whole of it in one minute, in English and in Arabic.",
        kicker: "Sarjy / A short film",
      },
      scene: minuteScene(false),
      extraCss: minuteCss,
    }),
  },
  {
    file: "film-sarjy-fi-daqiqa.png",
    html: page({
      lang: "ar",
      bg: "var(--sky-day-low)",
      ink: "var(--saddle)",
      copy: {
        title: "سرجي في دقيقة.",
        body: "قلها مرة وحدة ويتذكرها. كله في دقيقة، بالعربي وبالإنجليزي.",
        kicker: "سرجي · فيلم قصير",
      },
      scene: minuteScene(true),
      extraCss: minuteCss,
    }),
  },
  {
    file: "film-fennecs-travel-vlog.png",
    html: page({
      lang: "en",
      bg: "var(--sky-day-low)",
      ink: "var(--saddle)",
      copy: {
        title: "Fennec’s Travel Vlog.",
        body: "Live from the desert, with its finest gentleman.<br>Camels: not cute.",
        kicker: "Sarjy / Live from the desert",
      },
      scene: vlogScene(false),
      extraCss: vlogCss(false),
    }),
  },
  {
    file: "film-fallog-fennec.png",
    html: page({
      lang: "ar",
      bg: "var(--sky-day-low)",
      ink: "var(--saddle)",
      copy: {
        title: "فلوق فنك.",
        body: "مباشرة من البر، مع أشيك واحد فيه.<br>البعارين مو كيوت.",
        kicker: "سرجي · مباشرة من البر",
      },
      scene: vlogScene(true),
      extraCss: vlogCss(true),
    }),
  },
  {
    file: "film-the-star-in-the-well.png",
    html: page({
      lang: "en",
      bg: "var(--sky-night-top)",
      ink: "var(--frost)",
      copy: {
        title: "The Star in the Well.",
        body: "This year, Suhail didn't rise with his rain. The Rafeeqs found out why.",
        kicker: "Sarjy / Tales of the Straw Road",
      },
      scene: wellScene(false),
      extraCss: wellCss,
    }),
  },
  {
    file: "film-suhail-fi-albeer.png",
    html: page({
      lang: "ar",
      bg: "var(--sky-night-top)",
      ink: "var(--frost)",
      copy: {
        title: "سهيل في البير.",
        body: "هالسنة سهيل ما طلع بمطره. والرفقاء عرفوا ليش.",
        kicker: "سرجي · حكايات درب التبانة",
      },
      scene: wellScene(true),
      extraCss: wellCss,
    }),
  },
  {
    file: "film-end-of-winter.png",
    html: page({
      lang: "en",
      bg: "var(--sky-night-top)",
      ink: "var(--frost)",
      copy: {
        title: "End of Winter.",
        body: "Saffron, and one clove. He told Sarjy at the start of winter.",
        kicker: "Sarjy / A short film",
      },
      scene: winterScene(false),
      extraCss: winterCss,
    }),
  },
  {
    file: "film-akhir-alshita.png",
    html: page({
      lang: "ar",
      bg: "var(--sky-night-top)",
      ink: "var(--frost)",
      copy: {
        title: "آخر الشتاء.",
        body: "زعفران، وحبة مسمار وحدة. قالها لسرجي أول الشتاء.",
        kicker: "سرجي · فيلم قصير",
      },
      scene: winterScene(true),
      extraCss: winterCss,
    }),
  },
];

if (outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const c of CARDS) writeFileSync(join(outDir, c.file.replace(/\.png$/, ".html")), c.html);
  writeFileSync(join(outDir, "cards.json"), JSON.stringify(CARDS.map((c) => c.file)));
}
