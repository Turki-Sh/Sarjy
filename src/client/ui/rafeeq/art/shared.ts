// Shared pieces of the companions' art (Rafeeq, Turki's direction, Day 3). Each companion is SVG
// markup on a 200 x 200 box, standing on y = 186, written as plain strings so the app and the
// art lab (scripts/rafeeq/lab.mjs) draw exactly the same thing. Colors are tokens (tokens.css,
// the --plush-*, --rider-* ... families), always through style, since SVG attributes can't read
// CSS variables. Classes starting with r- are the moving parts Rafeeq.module.css animates.

/** A fill from a token. */
export const fill = (token: string) => `style="fill:var(--${token})"`;
/** A stroke from a token, with its width. */
export const stroke = (token: string, width: number, extra = "") =>
  `style="fill:none;stroke:var(--${token});stroke-width:${width};stroke-linecap:round;stroke-linejoin:round;${extra}"`;
/** A gradient stop from a token. */
export const stop = (offset: string, token: string, opacity = 1) =>
  `<stop offset="${offset}" style="stop-color:var(--${token});stop-opacity:${opacity}"/>`;

/**
 * A felt or fur grain: the same black noise tile as --grain-ink in tokens.css, as an image the
 * browser draws once and reuses, laid over a shape at low opacity (multiply), so surfaces read as
 * soft material instead of flat color. (An SVG filter here would be redrawn every frame.)
 */
const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/** Defs every companion can use: the grain, a soft ground shadow, a woven Sadu band. */
export function commonDefs(uid: string): string {
  return `
  <pattern id="${uid}-grain" width="60" height="60" patternUnits="userSpaceOnUse">
    <image href="${GRAIN}" width="60" height="60"/>
  </pattern>
  <radialGradient id="${uid}-ground" cx="50%" cy="50%" r="50%">
    ${stop("0", "rafeeq-ink", 0.22)}${stop("0.6", "rafeeq-ink", 0.08)}${stop("1", "rafeeq-ink", 0)}
  </radialGradient>
  <pattern id="${uid}-sadu" width="16" height="12" patternUnits="userSpaceOnUse">
    <rect width="16" height="12" ${fill("sadu-red")}/>
    <path d="M0 12 L4 5 L8 12 L12 5 L16 12" ${stroke("sadu-cream", 1.6)}/>
    <path d="M4 0 L6.5 2.5 L4 5 L1.5 2.5 Z M12 0 L14.5 2.5 L12 5 L9.5 2.5 Z" ${fill("sadu-dark")}/>
  </pattern>`;
}

/** The soft shadow a companion stands on. */
export const ground = (uid: string, rx = 58) =>
  `<ellipse class="r-ground" cx="100" cy="187" rx="${rx}" ry="8" fill="url(#${uid}-grain)" style="fill:url(#${uid}-ground)"/>`;

/** Grain over a shape: the same path, filled with the noise, multiplied in. */
export const grain = (uid: string, d: string, opacity = 0.3) =>
  `<path d="${d}" fill="url(#${uid}-grain)" style="mix-blend-mode:multiply;opacity:${opacity}"/>`;

/** A woven Sadu band along a path's box: the pattern, edged with a dark and an orange stripe. */
export const saduBand = (uid: string, x: number, y: number, w: number, h: number, extra = "") => `
  <g ${extra}>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="url(#${uid}-sadu)"/>
    <rect x="${x}" y="${y}" width="${w}" height="2.2" ${fill("sadu-dark")}/>
    <rect x="${x}" y="${y + h - 2.2}" width="${w}" height="2.2" ${fill("sadu-dark")}/>
    <rect x="${x}" y="${y + 2.2}" width="${w}" height="1.4" ${fill("sadu-orange")}/>
  </g>`;

/**
 * A tassel hanging from (x, y): a cord, a knot, and a fringe. It sways on its own (r-tassel),
 * a little behind the body, like a real one.
 */
export const tassel = (x: number, y: number, length: number, token: string, delay = 0) => {
  const top = y + length * 0.35;
  const fringe = Array.from({ length: 7 }, (_, i) => {
    const dx = (i - 3) * 1.6;
    return `<path d="M${x + dx * 0.4} ${top + 4} Q${x + dx} ${top + length * 0.5} ${x + dx * 1.5} ${y + length}" ${stroke(token, 1.6)}/>`;
  }).join("");
  return `
  <g class="r-tassel" style="transform-origin:${x}px ${y}px;animation-delay:${delay}s">
    <path d="M${x} ${y} V${top}" ${stroke(token, 1.8)}/>
    ${fringe}
    <ellipse cx="${x}" cy="${top + 2}" rx="3.6" ry="4.2" ${fill(token)}/>
    <ellipse cx="${x - 1}" cy="${top + 1}" rx="1.3" ry="1.6" style="fill:var(--rafeeq-shine);opacity:.35"/>
  </g>`;
};

/** A brass ring or medallion. */
export const brass = (uid: string, x: number, y: number, r: number) => `
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${uid}-brass)"/>
  <circle cx="${x}" cy="${y}" r="${r * 0.62}" ${stroke("brass-dark", r * 0.16)}/>
  <circle cx="${x - r * 0.32}" cy="${y - r * 0.34}" r="${r * 0.22}" style="fill:var(--rafeeq-shine);opacity:.55"/>`;

export const brassDefs = (uid: string) => `
  <radialGradient id="${uid}-brass" cx="35%" cy="30%" r="75%">
    ${stop("0", "brass-light")}${stop("0.55", "brass")}${stop("1", "brass-dark")}
  </radialGradient>`;

type FaceSpec = {
  /** The face's center. */
  cx: number;
  y: number;
  /** Half the distance between the eyes. */
  spread: number;
  /** Plush: a charcoal felt face patch, bead eyes, stitched mouth. Classic: eyes on the body. */
  plush?: { rx: number; ry: number; cy: number } | null;
  eye?: number;
};

/**
 * The face every companion shares (Turki, Day 3): eyes, blush, and the cat's ω mouth with a small
 * open mouth under it for talking. Every eye shape is drawn once (open, happy ^ ^, closed ‿ ‿);
 * the stylesheet shows one. On a plush companion the eyes are glossy beads on a felt patch, and
 * the patch and the eyes move by different amounts as it looks around, like a head turning.
 */
export function face(uid: string, { cx, y, spread, plush = null, eye = 1 }: FaceSpec): string {
  const lx = cx - spread;
  const rx = cx + spread;
  const s = eye * (plush ? 0.62 : 1);
  const bead = (x: number) => `
    <g class="r-eye" style="transform-origin:${x}px ${y}px">
      <ellipse cx="${x}" cy="${y}" rx="${7.5 * s}" ry="${9.5 * s}" ${fill("rafeeq-ink")}/>
      ${plush ? `<ellipse cx="${x}" cy="${y}" rx="${7.5 * s + 0.9}" ry="${9.5 * s + 0.9}" ${stroke("plush-face-sheen", 1)}/>` : ""}
      <circle cx="${x + 2.5 * s}" cy="${y - 3.5 * s}" r="${2.7 * s}" ${fill("rafeeq-shine")}/>
      <circle cx="${x - 2.2 * s}" cy="${y + 3.2 * s}" r="${1.1 * s}" style="fill:var(--rafeeq-shine);opacity:.7"/>
    </g>`;
  const line = plush ? "plush-stitch" : "rafeeq-ink";
  const w = plush ? 2.6 : 4.5;
  const arc = (x: number, d: string) => `<path d="M${x - 8 * s} ${y + 1} ${d}" ${stroke(line, w)}/>`;
  const up = `q${8 * s} ${-10 * s} ${16 * s} 0`;
  const down = `q${8 * s} ${7 * s} ${16 * s} 0`;
  const my = y + (plush ? 10 : 14);
  const m = plush ? 0.7 : 1;
  const features = `
    <g class="r-features">
      <g class="r-open">${bead(lx)}${bead(rx)}</g>
      <g class="r-happy">${arc(lx, up)}${arc(rx, up)}</g>
      <g class="r-closed">${arc(lx, down)}${arc(rx, down)}</g>
      <ellipse class="r-blush${plush ? " r-blush-soft" : ""}" cx="${lx - 10 * m}" cy="${my - 1}" rx="${7 * m}" ry="${4 * m}"/>
      <ellipse class="r-blush${plush ? " r-blush-soft" : ""}" cx="${rx + 10 * m}" cy="${my - 1}" rx="${7 * m}" ry="${4 * m}"/>
      <path class="r-mouth" d="M${cx - 8 * m} ${my} q${4 * m} ${5 * m} ${8 * m} 0 q${4 * m} ${5 * m} ${8 * m} 0" ${stroke(line, plush ? 1.9 : 3.2)}/>
      <g class="r-talk" style="transform-origin:${cx}px ${my + 3}px">
        <ellipse cx="${cx}" cy="${my + 7 * m}" rx="${5.5 * m}" ry="${5 * m}" ${fill(plush ? "plush-mouth" : "rafeeq-ink")}/>
        <ellipse cx="${cx}" cy="${my + 9.5 * m}" rx="${3.2 * m}" ry="${2 * m}" ${fill("rafeeq-blush")}/>
      </g>
    </g>`;
  if (!plush) return `<g class="r-face">${features}</g>`;
  const patch = `M${cx} ${plush.cy - plush.ry} a${plush.rx} ${plush.ry} 0 1 0 0.01 0 Z`;
  return `
  <defs>
    <radialGradient id="${uid}-facefelt" cx="38%" cy="32%" r="80%">
      ${stop("0", "plush-face-sheen")}${stop("0.45", "plush-face")}${stop("1", "plush-face-deep")}
    </radialGradient>
  </defs>
  <g class="r-face r-plush-face">
    <ellipse cx="${cx}" cy="${plush.cy}" rx="${plush.rx}" ry="${plush.ry}" fill="url(#${uid}-facefelt)"/>
    ${grain(uid, patch, 0.45)}
    <ellipse cx="${cx}" cy="${plush.cy}" rx="${plush.rx - 3}" ry="${plush.ry - 3}" ${stroke("plush-stitch", 1.1, "stroke-dasharray:2.5 3.5;opacity:.45")}/>
    <path d="M${cx - plush.rx * 0.72} ${plush.cy - plush.ry * 0.45} Q${cx - plush.rx * 0.3} ${plush.cy - plush.ry * 0.95} ${cx + plush.rx * 0.25} ${plush.cy - plush.ry * 0.9}" ${stroke("plush-face-sheen", 2.4, "opacity:.6")}/>
    ${features}
  </g>`;
}
