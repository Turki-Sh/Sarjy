// A seat's color, as a CSS variable pointing at its token (tokens.css, --seat-1 to --seat-8).
// Colors stay in tokens.css; components only ever name them.

import type { CSSProperties } from "react";

export const seatStyle = (seat: number) => ({ "--seat": `var(--seat-${seat + 1})` }) as CSSProperties;
