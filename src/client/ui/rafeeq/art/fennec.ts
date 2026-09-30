// Fennec (فنك): the desert fox, with big ears that perk up for every search. Curious and quick.
// (The first Scout, Day 3; renamed when the plush Rafeeqs took the name.)

import { commonDefs, face, fill, grain, ground, stop, stroke } from "./shared";

const BODY = "M44 184 C40 134 62 100 100 100 C138 100 160 134 156 184 Z";
const EAR_L = "M60 122 C52 98 44 66 42 40 C62 56 84 80 94 104 Z";
const EAR_R = "M140 122 C148 98 156 66 158 40 C138 56 116 80 106 104 Z";
const TAIL = "M144 172 C172 176 190 154 182 130 C178 118 166 118 162 126 C170 140 164 158 144 162 Z";

export const fennec = (uid: string) => `
<defs>
  ${commonDefs(uid)}
  <radialGradient id="${uid}-body" cx="40%" cy="30%" r="85%">${stop("0", "fennec-light")}${stop("0.55", "fennec-body")}${stop("1", "fennec-shade")}</radialGradient>
  <linearGradient id="${uid}-inner" x1="0" y1="1" x2="0" y2="0">${stop("0", "fennec-cream")}${stop("1", "fennec-light")}</linearGradient>
</defs>
${ground(uid, 60)}
<g class="r-tail" style="transform-origin:150px 168px">
  <path d="${TAIL}" fill="url(#${uid}-body)"/>
  <path d="M182 130 C178 118 166 118 162 126 C168 131 175 133 182 130 Z" ${fill("fennec-cream")}/>
</g>
<g class="r-body">
  <g class="r-ear r-ear-l">
    <path d="${EAR_L}" fill="url(#${uid}-body)"/>
    <path d="M62 112 C56 94 52 74 51 58 C64 72 78 88 86 104 Z" fill="url(#${uid}-inner)"/>
    <path d="M56 100 l6 -4 M58 108 l7 -3" ${stroke("fennec-cream", 1.4, "opacity:.9")}/>
  </g>
  <g class="r-ear r-ear-r">
    <path d="${EAR_R}" fill="url(#${uid}-body)"/>
    <path d="M138 112 C144 94 148 74 149 58 C136 72 122 88 114 104 Z" fill="url(#${uid}-inner)"/>
    <path d="M144 100 l-6 -4 M142 108 l-7 -3" ${stroke("fennec-cream", 1.4, "opacity:.9")}/>
  </g>
  <path d="${BODY}" fill="url(#${uid}-body)"/>
  ${grain(uid, BODY, 0.2)}
  <path d="M70 172 C72 152 86 144 100 144 C114 144 128 152 130 172 C120 180 80 180 70 172 Z" ${fill("fennec-cream")}/>
  <path d="M62 132 C70 114 84 106 100 106" ${stroke("fennec-light", 3.5, "opacity:.8")}/>
  ${face(uid, { cx: 100, y: 136, spread: 18 })}
</g>`;
