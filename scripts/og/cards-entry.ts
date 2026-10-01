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

// ---- The cards. File names say what each one shows, like Turki's.

export const CARDS = [
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
];

if (outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const c of CARDS) writeFileSync(join(outDir, c.file.replace(/\.png$/, ".html")), c.html);
  writeFileSync(join(outDir, "cards.json"), JSON.stringify(CARDS.map((c) => c.file)));
}
