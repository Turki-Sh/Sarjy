// Rafeeq (رفيق), a companion on the road (PRD, section Rafeeq; Turki's design, Day 3). Off by
// default; when you pick one it takes the orb's place in your own chats (never in a Majlis). Four
// companions, all from the desert and its people, with the same round eyes and cat mouth:
//   rider    a sand dune in a red shemagh and agal: bold and cheerful
//   keeper   keeper of what you tell Sarjy, in memory's Dusk, with a lantern that lights on a save
//   scout    a fennec with big ears, perking up for every search
//   drifter  a wisp of wind-blown sand that floats beside you
// Your bond with it grows as you use Sarjy together, in five levels, each unlocking something.

export const RAFEEQS = ["rider", "keeper", "scout", "drifter"] as const;
export type RafeeqId = (typeof RAFEEQS)[number];
export const isRafeeq = (value: unknown): value is RafeeqId => RAFEEQS.includes(value as RafeeqId);

/** The bond levels, and how much bond each needs. The last is the name itself: a true Rafeeq. */
export const BOND_LEVELS = [0, 15, 45, 100, 180] as const;

export type Bond = {
  /** 1 to 5. */
  level: number;
  /** How far to the next level, 0 to 1 (1 at the last level). */
  progress: number;
  /** The bond needed for the next level, or null at the last. */
  next: number | null;
};

export function bondOf(points: number): Bond {
  const p = Math.max(0, Math.floor(points));
  let level = 1;
  while (level < BOND_LEVELS.length && p >= BOND_LEVELS[level]!) level++;
  const from = BOND_LEVELS[level - 1]!;
  const to = BOND_LEVELS[level];
  return { level, progress: to === undefined ? 1 : (p - from) / (to - from), next: to ?? null };
}

/** What grows the bond, and how much in a day at most (so it grows with use, not with clicking). */
export const GAINS = {
  /** Coming back: once a day. */
  visit: { points: 5, perDay: 5 },
  /** A conversation turn with Sarjy. */
  turn: { points: 2, perDay: 30 },
  /** Something remembered. */
  save: { points: 3, perDay: 15 },
  /** Petting it (stroking it with the pointer or a finger). */
  pet: { points: 1, perDay: 10 },
} as const;
export type BondEvent = keyof typeof GAINS;
export const isBondEvent = (value: unknown): value is BondEvent =>
  typeof value === "string" && Object.hasOwn(GAINS, value);

/** What each level unlocks (Settings, Rafeeq, lists them). */
export const UNLOCKS = {
  /** Level 2: it greets you when you arrive. */
  greet: 2,
  /** Level 3: it purrs, blushes and shows hearts when you pet it. */
  purr: 3,
  /** Level 4: its own trick, now and then, while it waits. */
  trick: 4,
  /** Level 5: a gold star, and a golden glow on every save. */
  star: 5,
} as const;
