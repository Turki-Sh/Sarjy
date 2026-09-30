// Breeze (نسيم): a puff of desert wind, soft as a cloud, with ribbons of breeze curling around it
// and a few grains of sand riding along. Dreamy, always drifting. (Redrawn on Day 3: the first
// Drifter's tail read wrong, so the wind now moves around it instead of trailing behind.)

import { PERSONALITIES } from "@/shared/rafeeq";
import { commonDefs, face, fill, grain, ground, stop, stroke } from "./shared";

const BODY =
  "M58 150 C38 150 30 128 44 114 C40 96 56 82 74 88 C80 70 98 62 114 70 C128 64 146 74 146 92 C164 96 172 116 162 130 C170 146 158 162 140 160 C130 172 110 176 96 168 C82 176 62 170 58 150 Z";

export const breeze = (uid: string) => `
<defs>
  ${commonDefs(uid)}
  <radialGradient id="${uid}-body" cx="38%" cy="28%" r="80%">${stop("0", "breeze-light")}${stop("0.6", "breeze-body")}${stop("1", "breeze-shade")}</radialGradient>
</defs>
${ground(uid, 46)}
<g class="r-ribbon r-ribbon-back" style="transform-origin:100px 124px">
  <path d="M28 132 C24 104 48 80 78 78" ${stroke("breeze-shade", 3, "opacity:.55")}/>
  <path d="M172 104 C180 128 164 156 136 164" ${stroke("breeze-shade", 3, "opacity:.55")}/>
</g>
<g class="r-body">
  <path d="${BODY}" fill="url(#${uid}-body)"/>
  ${grain(uid, BODY, 0.12)}
  <path d="M58 104 C62 92 74 88 84 92 M104 76 C112 72 122 74 128 80" ${stroke("breeze-wind", 4, "opacity:.8")}/>
  <path d="M112 100 c8 -8 20 -2 16 8 c-3 6 -12 4 -10 -2" ${stroke("breeze-wind", 2.4, "opacity:.9")}/>
  ${face(uid, { cx: 100, y: 128, spread: 18, smile: PERSONALITIES.breeze.smile })}
</g>
<g class="r-ribbon" style="transform-origin:100px 124px">
  <path d="M20 118 C30 100 56 104 60 120 C63 132 48 136 44 126" ${stroke("breeze-shade", 5.5, "opacity:.35")}/>
  <path d="M20 118 C30 100 56 104 60 120 C63 132 48 136 44 126" ${stroke("breeze-wind", 3)}/>
  <path d="M184 142 C174 162 146 160 142 146" ${stroke("breeze-shade", 5.5, "opacity:.35")}/>
  <path d="M184 142 C174 162 146 160 142 146" ${stroke("breeze-wind", 3)}/>
  <circle class="r-grain" cx="36" cy="100" r="2.2" ${fill("rafeeq-gold")}/>
  <circle class="r-grain" cx="170" cy="120" r="1.8" ${fill("rafeeq-gold")}/>
  <circle class="r-grain" cx="150" cy="60" r="2.4" ${fill("rafeeq-gold")}/>
</g>`;
