// Lantern (فانوس): gentle and glowing, with a brass fanous that lights up for every memory.
// (The first Keeper, Day 3; renamed when the plush Rafeeqs took the name.)

import { brassDefs, commonDefs, face, fill, grain, ground, stop, stroke } from "./shared";

const BODY =
  "M100 66 C142 66 158 108 158 146 C158 174 134 184 100 184 C66 184 42 174 42 146 C42 108 58 66 100 66 Z";

export const lantern = (uid: string) => `
<defs>
  ${commonDefs(uid)}${brassDefs(uid)}
  <radialGradient id="${uid}-body" cx="38%" cy="28%" r="85%">${stop("0", "lantern-light")}${stop("0.55", "lantern-body")}${stop("1", "lantern-shade")}</radialGradient>
  <radialGradient id="${uid}-glow">${stop("0", "lantern-flame", 0.95)}${stop("1", "lantern-flame", 0)}</radialGradient>
  <radialGradient id="${uid}-glass" cx="50%" cy="60%" r="60%">${stop("0", "lantern-core")}${stop("1", "lantern-flame")}</radialGradient>
</defs>
${ground(uid, 58)}
<g class="r-lantern" style="transform-origin:166px 80px">
  <circle class="r-flame" cx="166" cy="112" r="26" fill="url(#${uid}-glow)"/>
  <path d="M166 80 V92" ${stroke("brass-dark", 2.5)}/>
  <circle cx="166" cy="80" r="3" ${stroke("brass", 2)}/>
  <path d="M156 94 L176 94 L180 100 L152 100 Z" fill="url(#${uid}-brass)"/>
  <path d="M154 100 L178 100 L176 124 L156 124 Z" fill="url(#${uid}-glass)"/>
  <path d="M166 100 V124 M160 100 L158 124 M172 100 L174 124" ${stroke("brass-dark", 1.2, "opacity:.7")}/>
  <ellipse class="r-flame-core" cx="166" cy="114" rx="3.2" ry="5" ${fill("lantern-core")} style="fill:var(--lantern-core);transform-origin:166px 118px"/>
  <path d="M153 124 L179 124 L175 130 L157 130 Z" fill="url(#${uid}-brass)"/>
</g>
<g class="r-body">
  <path d="${BODY}" fill="url(#${uid}-body)"/>
  ${grain(uid, BODY, 0.16)}
  <path class="r-tuft" d="M96 68 C91 52 102 42 112 47 C104 50 102 57 104 67 Z" ${fill("lantern-tuft")} style="fill:var(--lantern-tuft);transform-origin:100px 68px"/>
  <path d="M58 150 C62 170 80 178 100 178 C120 178 138 170 142 150 C132 160 118 164 100 164 C82 164 68 160 58 150 Z" ${fill("lantern-shade")}/>
  <path d="M60 104 C68 84 84 74 100 73" ${stroke("lantern-light", 4, "opacity:.8")}/>
  ${face(uid, { cx: 100, y: 120, spread: 18 })}
</g>`;
