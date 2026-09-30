// Where each person sits around the finjan: an arc over the top and down the sides, like cushions
// along the walls of a majlis, leaving the bottom open for the conversation. Everyone is spaced
// evenly; the arc widens as people come in, up to about 220 degrees for eight. Seat order runs
// from the reading start, so it mirrors in Arabic.

/** Degrees between two neighbours when there is room; the whole arc when there isn't. */
const STEP = 38;
const ARC = 220;

/** The angle of the i-th of n people, in degrees clockwise from the right (-90 is straight up). */
export function seatAngle(i: number, n: number, rtl: boolean): number {
  if (n <= 1) return -90;
  const step = Math.min(STEP, ARC / (n - 1));
  const offset = (i - (n - 1) / 2) * step;
  return -90 + (rtl ? -offset : offset);
}
