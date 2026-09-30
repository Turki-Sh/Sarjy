// A tiny seeded random (mulberry32). The server picks a seed, the browser draws from it, and both
// draw the same thing: a sky's stars, the 404's shuffled scene. Not for anything secret.

export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A copy of the list in a random order (Fisher-Yates), drawn from `rand`. */
export function shuffled<T>(list: readonly T[], rand: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** A new seed, for a scene that should differ each time. */
export const freshSeed = (): number => Math.floor(Math.random() * 2 ** 31);
