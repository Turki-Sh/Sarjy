// The five faces from the visual identity (section 5), self-hosted by next/font.
// Each exposes a CSS variable that src/styles/globals.css maps onto the brand's font tokens.

import {
  Figtree,
  IBM_Plex_Sans_Arabic,
  JetBrains_Mono,
  Newsreader,
  Noto_Naskh_Arabic,
} from "next/font/google";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--nf-figtree",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500"],
  variable: "--nf-newsreader",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600"],
  variable: "--nf-plex-arabic",
});

const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["500", "700"], variable: "--nf-naskh" });

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--nf-mono" });

export const fontVariables = [figtree, newsreader, plexArabic, naskh, mono].map((f) => f.variable).join(" ");
