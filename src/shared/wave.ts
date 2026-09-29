// The motion centerline of the Sarjy symbol, from the visual identity (section 6, "Motion centerline").
// In the symbol's 224 x 152 viewBox, stroke 22, round caps. At a1 = a2 = s = 1 it matches the master symbol.

export type WaveShape = {
  /** Height of the first raised end (the pommel). 1 is the master shape. */
  a1: number;
  /** Height of the second raised end (the cantle). 1 is the master shape. */
  a2: number;
  /** Depth of the seat. 1 is the master shape. */
  s: number;
};

export const REST: WaveShape = { a1: 1, a2: 1, s: 1 };

const round = (n: number) => n.toFixed(2);

/** The SVG path for a wave shape. */
export function wavePath({ a1, a2, s }: WaveShape): string {
  const pl = round(107 - 66 * a1);
  const pr = round(107 - 78 * a2);
  const sy = round(107 + 7 * s);
  return (
    `M24 107 C36 107 40 ${pl} 57 ${pl} C72 ${pl} 82 ${sy} 112 ${sy} ` +
    `C142 ${sy} 150 ${pr} 168 ${pr} C186 ${pr} 186 107 200 107`
  );
}

/** Moves a shape toward a target by a fraction k (the brand eases about 14% per frame). */
export function easeToward(current: WaveShape, target: WaveShape, k: number): WaveShape {
  return {
    a1: current.a1 + (target.a1 - current.a1) * k,
    a2: current.a2 + (target.a2 - current.a2) * k,
    s: current.s + (target.s - current.s) * k,
  };
}

/** True when a shape is close enough to rest that the orb can crossfade back to the master symbol. */
export function isAtRest({ a1, a2, s }: WaveShape): boolean {
  return Math.abs(a1 - 1) < 0.01 && Math.abs(a2 - 1) < 0.01 && Math.abs(s - 1) < 0.02;
}
