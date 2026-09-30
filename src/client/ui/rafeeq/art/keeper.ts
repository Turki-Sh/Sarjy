// Keeper: dependable, gentle, generous. Carries what matters, so the journey feels easier. A wide
// cream loaf under a woven blanket tied with a braided rope, a leather satchel with a Sadu flap and
// a big cream tassel at its side. It keeps what you tell Sarjy.

import { PERSONALITIES } from "@/shared/rafeeq";
import { brass, brassDefs, commonDefs, face, fill, grain, ground, stop, stroke, tassel } from "./shared";

const BODY =
  "M38 92 C42 72 64 64 100 64 C136 64 158 72 162 92 C172 108 178 130 176 150 C174 172 158 180 100 180 C42 180 26 172 24 150 C22 130 28 108 38 92 Z";
const BLANKET =
  "M36 96 C40 74 64 62 100 62 C136 62 160 74 164 96 C168 110 170 124 170 140 C158 132 150 118 146 104 C130 98 116 96 100 96 C84 96 70 98 54 104 C50 118 42 132 30 140 C30 124 32 110 36 96 Z";
const BAG =
  "M14 110 C14 104 18 100 24 100 L54 100 C60 100 64 104 64 110 L64 146 C64 152 60 156 54 156 L24 156 C18 156 14 152 14 146 Z";
const FLAP =
  "M13 106 C13 101 17 98 22 98 L56 98 C61 98 65 101 65 106 L65 126 C65 130 62 133 58 133 L20 133 C16 133 13 130 13 126 Z";

/** A braided rope along a curve: small leaning ovals, alternating tone. */
function rope(from: [number, number], via: [number, number], to: [number, number], n = 22) {
  const pt = (t: number) => {
    const u = 1 - t;
    return [
      u * u * from[0] + 2 * u * t * via[0] + t * t * to[0],
      u * u * from[1] + 2 * u * t * via[1] + t * t * to[1],
    ] as const;
  };
  return Array.from({ length: n }, (_, i) => {
    const [x, y] = pt(i / (n - 1));
    const [x2, y2] = pt(Math.min(1, (i + 1) / (n - 1)));
    const a = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI + 35;
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4.2" ry="2.6" transform="rotate(${a.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" ${fill(i % 2 ? "tassel-cream" : "plush-cream-deep")}/>`;
  }).join("");
}

export const keeper = (uid: string) => `
<defs>
  ${commonDefs(uid)}${brassDefs(uid)}
  <radialGradient id="${uid}-body" cx="40%" cy="30%" r="85%">
    ${stop("0", "plush-cream-light")}${stop("0.5", "plush-cream")}${stop("0.85", "plush-cream-shade")}${stop("1", "plush-cream-deep")}
  </radialGradient>
  <linearGradient id="${uid}-blanket" x1="0" y1="0" x2="0" y2="1">${stop("0", "plush-cream-light")}${stop("1", "plush-cream-shade")}</linearGradient>
  <linearGradient id="${uid}-bag" x1="0" y1="0" x2="1" y2="1">${stop("0", "leather-light")}${stop("0.6", "leather")}${stop("1", "leather-dark")}</linearGradient>
</defs>
${ground(uid, 72)}
<g class="r-body">
  <g class="r-leg"><ellipse cx="58" cy="177" rx="15" ry="8" ${fill("plush-foot")}/><ellipse cx="142" cy="177" rx="15" ry="8" ${fill("plush-foot")}/></g>
  <path d="${BODY}" fill="url(#${uid}-body)"/>
  ${grain(uid, BODY, 0.3)}
  <path d="M34 156 C56 176 144 176 166 156" ${stroke("plush-cream-deep", 8, "opacity:.22")}/>

  <!-- the blanket over its back: cream weave with a Sadu border, and the rope that ties it -->
  <path d="${BLANKET}" fill="url(#${uid}-blanket)"/>
  ${grain(uid, BLANKET, 0.4)}
  <path d="M54 104 C70 98 84 96 100 96 C116 96 130 98 146 104" style="fill:none;stroke:url(#${uid}-sadu);stroke-width:9"/>
  <path d="M40 132 C46 122 50 112 54 104" style="fill:none;stroke:url(#${uid}-sadu);stroke-width:7"/>
  <path d="M160 132 C154 122 150 112 146 104" style="fill:none;stroke:url(#${uid}-sadu);stroke-width:7"/>
  <path d="M44 84 C60 72 80 70 100 70 C120 70 140 72 156 84" ${stroke("plush-cream-deep", 1, "stroke-dasharray:2 4;opacity:.6")}/>
  ${rope([38, 98], [100, 50], [162, 98])}
  <g class="r-knot">${tassel(162, 98, 22, "tassel-cream", 0.3)}<circle cx="162" cy="98" r="5" ${fill("plush-cream-deep")}/></g>

  <!-- a soft shadow under the face, then the face -->
  <ellipse cx="106" cy="136" rx="48" ry="34" style="fill:var(--rafeeq-ink);opacity:.12"/>
  ${face(uid, { cx: 106, y: 128, spread: 16, plush: { cy: 130, rx: 46, ry: 32 }, smile: PERSONALITIES.keeper.smile })}

  <!-- the satchel at its side: leather, a Sadu flap, a brass buckle, a big tassel -->
  <g class="r-bag">
    <path d="${BAG}" fill="url(#${uid}-bag)"/>
    ${grain(uid, BAG, 0.35)}
    <path d="${FLAP}" ${fill("leather-dark")}/>
    <rect x="18" y="104" width="42" height="18" rx="2" fill="url(#${uid}-sadu)"/>
    <path d="M17 102 H61 M17 124 H61" ${stroke("leather-stitch", 1, "stroke-dasharray:2.5 2.5;opacity:.8")}/>
    <path d="M39 124 V140" ${stroke("leather-dark", 6)}/>
    <rect x="33" y="136" width="12" height="10" rx="2" ${stroke("brass", 2.4)}/>
    ${tassel(58, 150, 34, "tassel-cream", 0.6)}
    ${brass(uid, 58, 150, 4.5)}
  </g>
</g>`;
