// Drifter: relaxed, adaptable, dreamy. Finds beauty in the in-between and turns detours into
// stories. A suede body lying low, a big hood whose tip flops to one side with a tassel, a woven
// scarf with tassels, and a little leather bag on its back.

import { brassDefs, commonDefs, face, fill, grain, ground, stop, stroke, tassel } from "./shared";

const BODY =
  "M40 150 C38 124 60 106 98 104 C142 102 176 118 182 150 C186 172 168 182 112 182 C62 182 42 174 40 150 Z";
const HOOD = "M96 36 C124 36 144 58 144 88 C144 118 124 136 96 136 C66 136 46 118 46 90 C46 60 68 36 96 36 Z";
const TIP = "M128 50 C150 52 166 70 168 96 C170 110 166 120 160 126 C158 110 150 92 136 78 Z";
const BAG =
  "M136 108 C136 102 140 98 146 98 L170 98 C176 98 180 102 180 108 L180 130 C180 136 176 140 170 140 L146 140 C140 140 136 136 136 130 Z";

export const drifter = (uid: string) => `
<defs>
  ${commonDefs(uid)}${brassDefs(uid)}
  <radialGradient id="${uid}-suede" cx="36%" cy="26%" r="90%">
    ${stop("0", "suede-light")}${stop("0.55", "suede")}${stop("1", "suede-dark")}
  </radialGradient>
  <linearGradient id="${uid}-scarf" x1="0" y1="0" x2="0" y2="1">${stop("0", "scarf-light")}${stop("0.5", "scarf")}${stop("1", "scarf-dark")}</linearGradient>
  <linearGradient id="${uid}-bag" x1="0" y1="0" x2="1" y2="1">${stop("0", "leather-light")}${stop("1", "leather-dark")}</linearGradient>
</defs>
${ground(uid, 74)}
<g class="r-body">
  <g class="r-leg"><ellipse cx="72" cy="180" rx="13" ry="7" ${fill("plush-foot")}/><ellipse cx="104" cy="182" rx="13" ry="7" ${fill("plush-foot")}/><ellipse cx="172" cy="178" rx="11" ry="6" ${fill("plush-foot")}/></g>
  <path d="${BODY}" fill="url(#${uid}-suede)"/>
  ${grain(uid, BODY, 0.4)}
  <path d="M110 110 C140 108 166 120 176 142" ${stroke("suede-light", 3, "opacity:.55")}/>

  <!-- the little bag on its back -->
  <g class="r-bag">
    <path d="${BAG}" fill="url(#${uid}-bag)"/>
    <path d="M135 104 C135 99 139 96 144 96 L172 96 C177 96 181 99 181 104 L181 118 L135 118 Z" ${fill("leather-dark")}/>
    <path d="M136 100 H180 M136 116 H180" ${stroke("leather-stitch", 1, "stroke-dasharray:2.5 2.5;opacity:.8")}/>
    <rect x="152" y="112" width="12" height="9" rx="2" ${stroke("brass", 2.2)}/>
  </g>

  <!-- the hood, its floppy tip with a tassel -->
  <g class="r-hood-tip" style="transform-origin:132px 60px">
    <path d="${TIP}" fill="url(#${uid}-suede)"/>
    ${grain(uid, TIP, 0.4)}
    ${tassel(160, 124, 24, "tassel-cream", 0.4)}
  </g>
  <path d="${HOOD}" fill="url(#${uid}-suede)"/>
  ${grain(uid, HOOD, 0.4)}
  <path d="M56 80 C62 56 82 44 104 44" ${stroke("suede-light", 3, "opacity:.6")}/>
  <ellipse cx="96" cy="92" rx="33" ry="31" ${stroke("suede-dark", 6, "opacity:.55")}/>
  ${face(uid, { cx: 96, y: 88, spread: 12, plush: { cy: 92, rx: 30, ry: 28 } })}

  <!-- the scarf, woven, with tassels -->
  <path d="M50 126 C70 142 124 142 144 126 L146 138 C124 154 70 154 48 138 Z" fill="url(#${uid}-scarf)"/>
  ${grain(uid, "M50 126 C70 142 124 142 144 126 L146 138 C124 154 70 154 48 138 Z", 0.35)}
  <path d="M50 132 C70 146 124 146 144 132" ${stroke("sadu-cream", 1.4, "stroke-dasharray:4 3;opacity:.7")}/>
  <path d="M56 138 C52 150 50 160 52 168 L60 166 C60 158 62 150 64 142 Z" fill="url(#${uid}-scarf)"/>
  ${tassel(56, 166, 20, "tassel-cream", 0.2)}
  ${tassel(66, 146, 22, "tassel-blue", 0.5)}
</g>`;
