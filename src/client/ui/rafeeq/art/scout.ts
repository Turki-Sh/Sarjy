// Scout: curious, alert, observant. Notices what others miss, always a little further ahead. Tall,
// with a pointed cream hood edged in Sadu weave, dark felt arms, a woven cape on its back, and a
// leather collar with a brass ring and a tassel.

import { PERSONALITIES } from "@/shared/rafeeq";
import { brass, brassDefs, commonDefs, face, fill, grain, ground, stop, stroke, tassel } from "./shared";

const BELLY =
  "M100 100 C128 100 142 126 142 152 C142 174 124 184 100 184 C76 184 58 174 58 152 C58 126 72 100 100 100 Z";
const HOOD =
  "M100 44 C128 44 146 64 146 90 C146 114 128 128 100 128 C72 128 54 114 54 90 C54 64 72 44 100 44 Z";
/** The hood's tip: a felt point that leans and flops (r-hood-tip). */
const TIP = "M82 50 C86 34 96 20 112 12 C116 11 118 14 116 18 C112 30 114 42 120 52 Z";
const CAPE =
  "M58 112 C44 128 38 156 42 176 C50 170 56 160 60 148 Z M142 112 C156 128 162 156 158 176 C150 170 144 160 140 148 Z";

export const scout = (uid: string) => `
<defs>
  ${commonDefs(uid)}${brassDefs(uid)}
  <radialGradient id="${uid}-belly" cx="42%" cy="30%" r="80%">
    ${stop("0", "plush-cream-light")}${stop("0.55", "plush-cream")}${stop("1", "plush-cream-deep")}
  </radialGradient>
  <radialGradient id="${uid}-hood" cx="38%" cy="25%" r="90%">
    ${stop("0", "plush-cream-light")}${stop("0.5", "plush-cream")}${stop("0.9", "plush-cream-shade")}${stop("1", "plush-cream-deep")}
  </radialGradient>
  <linearGradient id="${uid}-arm" x1="0" y1="0" x2="0" y2="1">${stop("0", "plush-face-sheen")}${stop("1", "plush-face-deep")}</linearGradient>
</defs>
${ground(uid, 48)}
<g class="r-body">
  <g class="r-cape"><path d="${CAPE}" fill="url(#${uid}-sadu)"/><path d="${CAPE}" style="fill:var(--rafeeq-ink);opacity:.25"/></g>
  <g class="r-leg"><ellipse cx="86" cy="182" rx="11" ry="7" ${fill("plush-foot")}/><ellipse cx="114" cy="182" rx="11" ry="7" ${fill("plush-foot")}/></g>
  <g class="r-arm r-arm-l"><path d="M64 122 C48 134 44 160 52 174 C60 164 64 146 68 132 Z" fill="url(#${uid}-arm)"/></g>
  <g class="r-arm r-arm-r"><path d="M136 122 C152 134 156 160 148 174 C140 164 136 146 132 132 Z" fill="url(#${uid}-arm)"/></g>
  <path d="${BELLY}" fill="url(#${uid}-belly)"/>
  ${grain(uid, BELLY, 0.3)}

  <!-- the hood: cream felt, a pointed tip that flops, a Sadu edge around the face -->
  <g class="r-hood">
    <g class="r-hood-tip" style="transform-origin:100px 50px">
      <path d="${TIP}" fill="url(#${uid}-hood)"/>
      ${grain(uid, TIP, 0.32)}
      <path d="M92 44 C96 32 104 22 112 16" ${stroke("plush-cream-deep", 1.1, "stroke-dasharray:2 3;opacity:.7")}/>
    </g>
    <path d="${HOOD}" fill="url(#${uid}-hood)"/>
    ${grain(uid, HOOD, 0.32)}
    <path d="M60 96 C62 70 78 52 100 50 C124 52 140 72 140 96" ${stroke("plush-cream-light", 3, "opacity:.5")}/>
    <ellipse cx="100" cy="88" rx="33" ry="37" style="fill:none;stroke:url(#${uid}-sadu);stroke-width:8"/>
    <ellipse cx="100" cy="88" rx="37" ry="41" ${stroke("sadu-dark", 1.2, "opacity:.5")}/>
    ${face(uid, { cx: 100, y: 84, spread: 11, eye: 0.95, plush: { cy: 88, rx: 29, ry: 33 }, smile: PERSONALITIES.scout.smile })}
  </g>

  <!-- the collar: leather, a brass ring, a tassel -->
  <path d="M70 122 C84 132 116 132 130 122" ${stroke("leather-dark", 7)}/>
  <path d="M70 121 C84 130 116 130 130 121" ${stroke("leather", 4.5)}/>
  ${tassel(100, 134, 28, "tassel-blue", 0.2)}
  ${brass(uid, 100, 131, 5.5)}
</g>`;
