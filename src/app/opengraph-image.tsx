// The link preview image (Open Graph, also used for X): 1200 x 630.
// White canvas, the bilingual horizontal lockup drawn from the brand's paths, the tagline in the
// voice face, and the orb with its light. Rendered by next/og at build time, then cached.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { COLORS } from "@/shared/brand/colors";
import { ARABIC_WORDMARK_PATH, SYMBOL_PATH, WORDMARK_PATHS } from "@/shared/brand/marks";
import { t } from "@/shared/i18n";

export const alt = "Sarjy, a voice assistant that remembers what you tell it. Shaped to its rider.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", file));

/** The bilingual horizontal lockup: symbol, sarjy, a rule, سرجي (visual identity, section 1). */
function BilingualLockup({ width }: { width: number }) {
  return (
    <svg width={width} height={(width * 166) / 838.1} viewBox="0 0 838.1 166" fill={COLORS.saddle}>
      <g transform="translate(2 15) scale(.7)">
        <path d={SYMBOL_PATH} />
      </g>
      <g transform="translate(182 12)">
        {WORDMARK_PATHS.map((d) => (
          <path key={d.slice(0, 16)} d={d} />
        ))}
      </g>
      <rect x="550" y="36" width="2" height="94" rx="1" />
      <path transform="translate(575.31 81.62)" d={ARABIC_WORDMARK_PATH} />
    </svg>
  );
}

/**
 * The orb as one SVG: the blurred light (Saffron, Coral, Dusk), the glass sphere with its white rim
 * and specular highlight, and the symbol. SVG is rasterized with full gradient and blur support,
 * which the flexbox renderer lacks.
 */
function Orb({ size: d }: { size: number }) {
  return (
    <svg width={d} height={d} viewBox="0 0 400 400">
      <defs>
        <filter id="blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <radialGradient id="rim" cx="50%" cy="50%" r="50%">
          <stop offset="56%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="86%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
        </radialGradient>
        <radialGradient id="spec" cx="38%" cy="16%" r="30%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <clipPath id="sphere">
          <circle cx="200" cy="200" r="172" />
        </clipPath>
      </defs>
      <circle cx="200" cy="208" r="172" fill="#000000" fillOpacity="0.05" filter="url(#blur)" />
      <circle cx="200" cy="200" r="172" fill="#FFFFFF" />
      <g clipPath="url(#sphere)" filter="url(#blur)">
        <circle cx="150" cy="230" r="92" fill={COLORS.saffron} fillOpacity="0.85" />
        <circle cx="250" cy="220" r="86" fill={COLORS.coral} fillOpacity="0.75" />
        <circle cx="205" cy="130" r="82" fill={COLORS.dusk} fillOpacity="0.7" />
      </g>
      <circle cx="200" cy="200" r="172" fill="url(#rim)" />
      <ellipse cx="160" cy="80" rx="72" ry="34" fill="url(#spec)" />
      <circle cx="200" cy="200" r="172" fill="none" stroke="#000000" strokeOpacity="0.07" />
      <g transform="translate(88 124) scale(1)" fill={COLORS.saddle}>
        <path d={SYMBOL_PATH} />
      </g>
    </svg>
  );
}

export default async function OpenGraphImage() {
  const [figtree, newsreader] = await Promise.all([
    font("figtree/files/figtree-latin-400-normal.woff"),
    font("newsreader/files/newsreader-latin-400-italic.woff"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: COLORS.white,
        paddingLeft: 84,
        paddingRight: 64,
        fontFamily: "Figtree",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
        <BilingualLockup width={580} />
        <div
          style={{
            marginTop: 52,
            fontFamily: "Newsreader",
            fontStyle: "italic",
            fontSize: 62,
            lineHeight: 1.1,
            color: COLORS.ink,
          }}
        >
          {t("en").tagline}
        </div>
        <div style={{ marginTop: 20, fontSize: 27, lineHeight: 1.45, color: COLORS.graphite }}>
          A voice assistant that remembers what you tell it, answers from real tools, and shows you everything
          it keeps.
        </div>
      </div>
      <Orb size={380} />
    </div>,
    {
      ...size,
      fonts: [
        { name: "Figtree", data: figtree, weight: 400, style: "normal" },
        { name: "Newsreader", data: newsreader, weight: 400, style: "italic" },
      ],
    },
  );
}
