// Dune (كثيب): a sand dune in a red-checked shemagh and a black agal. Bold and cheerful.
// (The first Rider, Day 3; renamed when the plush Rafeeqs took the name.)

import { commonDefs, face, fill, grain, ground, stop, stroke } from "./shared";

const BODY = "M36 184 C34 128 60 90 100 90 C140 90 166 128 164 184 Z";
const CLOTH =
  "M30 172 C24 118 56 64 100 62 C144 64 176 118 170 172 C162 152 154 134 150 124 C140 106 122 100 100 100 C78 100 60 106 50 124 C46 134 38 152 30 172 Z";

export const dune = (uid: string) => `
<defs>
  ${commonDefs(uid)}
  <radialGradient id="${uid}-body" cx="40%" cy="30%" r="85%">${stop("0", "dune-light")}${stop("0.55", "dune-body")}${stop("1", "dune-shade")}</radialGradient>
  <pattern id="${uid}-shemagh" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="12" height="12" ${fill("dune-cloth")}/>
    <rect x="0" y="5" width="12" height="2" ${fill("dune-check")}/><rect x="5" y="0" width="2" height="12" ${fill("dune-check")}/>
    <rect x="4" y="4" width="4" height="4" ${fill("dune-check")}/>
  </pattern>
  <linearGradient id="${uid}-fold" x1="0" y1="0" x2="1" y2="0">
    ${stop("0", "rafeeq-ink", 0.22)}${stop("0.25", "rafeeq-ink", 0)}${stop("0.75", "rafeeq-ink", 0)}${stop("1", "rafeeq-ink", 0.22)}
  </linearGradient>
</defs>
${ground(uid, 62)}
<g class="r-body">
  <path d="${BODY}" fill="url(#${uid}-body)"/>
  ${grain(uid, BODY, 0.18)}
  <path d="M36 184 C58 172 80 178 100 170 C122 164 142 174 164 184 Z" ${fill("dune-shade")}/>
  <g class="r-cloth">
    <path d="${CLOTH}" fill="url(#${uid}-shemagh)" style="opacity:.92"/>
    <path d="${CLOTH}" fill="url(#${uid}-fold)"/>
    <path d="${CLOTH}" ${stroke("dune-check", 1.2, "opacity:.35")}/>
    <path d="M100 62 C92 78 90 92 92 102 M72 70 C62 90 56 110 50 124" ${stroke("rafeeq-ink", 1.6, "opacity:.12")}/>
  </g>
  <path d="M68 84 Q100 98 132 84" ${stroke("rafeeq-ink", 6)}/>
  <path d="M70 76 Q100 90 130 76" ${stroke("rafeeq-ink", 6)}/>
  <path d="M76 82 Q100 92 124 82" ${stroke("rafeeq-shine", 1.2, "opacity:.35")}/>
  ${face(uid, { cx: 100, y: 128, spread: 18 })}
</g>`;
