// Rider: the core Rafeeq. Balanced, attentive, ready. A round cream felt body on stubby legs,
// small brown ears, and on its back a leather saddle (Sarjy is "my saddle") over a woven Sadu
// blanket; a stitched strap across its chest with a brass medallion and a tassel, and a Sadu
// saddle cloth hanging down its side.

import { PERSONALITIES } from "@/shared/rafeeq";
import { brass, brassDefs, commonDefs, face, fill, grain, ground, stop, stroke, tassel } from "./shared";

const BODY =
  "M100 68 C150 68 176 100 176 134 C176 164 152 180 100 180 C48 180 24 164 24 134 C24 100 50 68 100 68 Z";
const SADDLE = "M62 92 C64 70 80 60 100 60 C120 60 136 70 138 92 C126 84 114 81 100 81 C86 81 74 84 62 92 Z";
const CLOTH =
  "M26 108 C34 102 50 100 58 102 C60 118 62 132 62 146 C52 150 38 150 30 146 C28 134 26 120 26 108 Z";
const LEG = (x: number) => `M${x - 16} 170 C${x - 16} 184 ${x + 16} 184 ${x + 16} 170 Z`;

export const rider = (uid: string) => `
<defs>
  ${commonDefs(uid)}${brassDefs(uid)}
  <radialGradient id="${uid}-body" cx="36%" cy="26%" r="85%">
    ${stop("0", "plush-cream-light")}${stop("0.5", "plush-cream")}${stop("0.85", "plush-cream-shade")}${stop("1", "plush-cream-deep")}
  </radialGradient>
  <linearGradient id="${uid}-leg" x1="0" y1="0" x2="0" y2="1">${stop("0", "plush-cream-shade")}${stop("1", "plush-cream-deep")}</linearGradient>
  <radialGradient id="${uid}-ear" cx="40%" cy="35%" r="70%">${stop("0", "plush-ear-light")}${stop("1", "plush-ear")}</radialGradient>
  <linearGradient id="${uid}-leather" x1="0" y1="0" x2="0" y2="1">${stop("0", "leather-light")}${stop("1", "leather-dark")}</linearGradient>
  <radialGradient id="${uid}-saddle" cx="45%" cy="20%" r="90%">${stop("0", "leather-light")}${stop("0.6", "leather")}${stop("1", "leather-dark")}</radialGradient>
  <linearGradient id="${uid}-fold" x1="0" y1="0" x2="1" y2="0">
    ${stop("0", "rafeeq-ink", 0.25)}${stop("0.35", "rafeeq-ink", 0)}${stop("0.8", "rafeeq-ink", 0.05)}${stop("1", "rafeeq-ink", 0.3)}
  </linearGradient>
</defs>
${ground(uid, 66)}
<g class="r-body">
  <g class="r-ear r-ear-l"><ellipse cx="56" cy="84" rx="15" ry="13" transform="rotate(-24 56 84)" fill="url(#${uid}-ear)"/><ellipse cx="57" cy="86" rx="7.5" ry="6.5" ${fill("plush-ear-deep")}/></g>
  <g class="r-ear r-ear-r"><ellipse cx="144" cy="84" rx="15" ry="13" transform="rotate(24 144 84)" fill="url(#${uid}-ear)"/><ellipse cx="143" cy="86" rx="7.5" ry="6.5" ${fill("plush-ear-deep")}/></g>
  <g class="r-leg"><path d="${LEG(68)}" fill="url(#${uid}-leg)"/><path d="${LEG(132)}" fill="url(#${uid}-leg)"/></g>
  <path d="${BODY}" fill="url(#${uid}-body)"/>
  ${grain(uid, BODY, 0.3)}
  <!-- soft shade where the belly meets the legs, and light along the top -->
  <path d="M38 152 C58 176 142 176 162 152" ${stroke("plush-cream-deep", 8, "opacity:.22")}/>
  <path d="M50 96 C66 76 92 70 112 71" ${stroke("plush-cream-light", 4, "opacity:.7")}/>

  <!-- on its back: a Sadu blanket, and a leather saddle with a brass-tipped pommel -->
  <path d="M56 98 C64 76 84 68 100 68 C116 68 136 76 144 98" style="fill:none;stroke:url(#${uid}-sadu);stroke-width:12"/>
  <path d="M56 98 C64 76 84 68 100 68 C116 68 136 76 144 98" ${stroke("sadu-dark", 1.4, "opacity:.6")}/>
  <path d="${SADDLE}" fill="url(#${uid}-saddle)"/>
  <path d="M66 89 C70 72 84 64 100 64 C116 64 130 72 134 89" ${stroke("leather-stitch", 1, "stroke-dasharray:3 3;opacity:.75")}/>
  <path d="M91 64 C90 50 110 50 109 64 Z" fill="url(#${uid}-leather)"/>
  ${brass(uid, 100, 52, 4.5)}

  <!-- the saddle cloth down its side: woven, folded, fringed -->
  <path d="${CLOTH}" fill="url(#${uid}-sadu)"/>
  <path d="${CLOTH}" fill="url(#${uid}-fold)"/>
  <path d="M27 110 C35 104 50 102 58 104" ${stroke("sadu-dark", 2.4)}/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${31 + i * 3.4} ${147 + Math.sin(i) * 0.8} v6" ${stroke("sadu-cream", 1.3)}/>`).join("")}

  <!-- the strap across its chest, stitched, with a medallion and a tassel -->
  <path d="M64 90 C48 124 70 162 112 166 C138 168 160 158 172 142" ${stroke("leather-dark", 8.5)}/>
  <path d="M64 90 C48 124 70 162 112 166 C138 168 160 158 172 142" style="fill:none;stroke:url(#${uid}-leather);stroke-width:6.5;stroke-linecap:round"/>
  <path d="M63 93 C49 124 71 159 112 163 C137 165 158 156 170 141" ${stroke("leather-stitch", 1, "stroke-dasharray:3 3;opacity:.8")}/>
  ${tassel(58, 152, 26, "tassel-blue", 0.1)}
  ${brass(uid, 58, 148, 8.5)}

  <!-- a soft shadow under the face, then the face -->
  <ellipse cx="104" cy="134" rx="46" ry="34" style="fill:var(--rafeeq-ink);opacity:.12"/>
  ${face(uid, { cx: 104, y: 126, spread: 15, plush: { cy: 128, rx: 44, ry: 32 }, smile: PERSONALITIES.rider.smile })}
</g>`;
