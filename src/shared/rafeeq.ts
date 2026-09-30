// Rafeeq (رفيق), a companion on the road (PRD, section Rafeeq; Turki's design, Day 3). Off by
// default; when you pick one it takes the orb's place in your own chats (never in a Majlis).
// Eight companions from the desert and its people, all with the same cat-mouthed face.
// The Rafeeqs, plush travellers in felt, leather, brass and woven Sadu (Turki's reference):
//   rider    the core Rafeeq: a saddle on its back, a strap and a medallion. Steady, attentive
//   keeper   carries what matters: a woven blanket, a rope, a satchel. Gentle, generous
//   scout    a tall hooded one, a little further ahead. Curious, alert
//   drifter  a suede wanderer in a floppy hood and scarf. Relaxed, dreamy
// And the first four:
//   dune     a sand dune in a red shemagh and agal: bold and cheerful
//   lantern  in memory's Dusk, with a brass fanous that lights on a save
//   fennec   the desert fox, ears up for every search
//   breeze   a puff of desert wind with ribbons of breeze around it
// Your bond grows with each one separately (like raising each of your companions on its own),
// in five levels, each unlocking something.

/** The plush Rafeeqs first: they lead the picker. */
export const RAFEEQS = [
  "rider",
  "keeper",
  "scout",
  "drifter",
  "dune",
  "lantern",
  "fennec",
  "breeze",
] as const;
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

/* ---- Personalities (Turki, Day 3: "each one has its own personality, feel, and even story") ----
   Each companion reacts in its own way: to your pointer resting on it, to petting, to a failed
   tool; it has its own energy (how quick and how big it moves), its own habits while it waits,
   and dozes off on its own schedule. The looks live in Rafeeq.module.css; this is who they are. */

/** How it takes your pointer resting on it. */
export type Temper = "attentive" | "shy" | "curious" | "unbothered" | "proud" | "warm" | "annoyed" | "dodge";
/** How it takes petting. */
export type PetStyle = "composed" | "melts" | "ticklish" | "giggles" | "grumbles";
/** How it takes a tool failing. */
export type FailStyle = "worried" | "determined" | "shrug" | "indignant" | "startle" | "spin";
/** The small things it does on its own while it waits. */
export const FIDGETS = ["hop", "twitch", "tilt", "yawn", "look", "nod", "stretch", "spin", "stomp"] as const;
export type Fidget = (typeof FIDGETS)[number];
/** A face beyond happy and asleep: brows, lids and mouth. */
export type Expression =
  "annoyed" | "wary" | "worried" | "smug" | "determined" | "content" | "shy" | "wide" | "giggle";

export type Personality = {
  temper: Temper;
  pet: PetStyle;
  fail: FailStyle;
  /** 0.6 slow and calm to 1.5 quick and bouncy: scales its moves and its breathing. */
  energy: number;
  /** How keenly its eyes follow your pointer (1 is the default). */
  gaze: number;
  /** How long with nothing happening before it dozes off. */
  sleepMs: number;
  fidgets: readonly Fidget[];
  /** Seconds between fidgets, at least and at most. */
  fidgetEvery: readonly [number, number];
  /** Its face at rest, if it has one of its own. */
  rest: Expression | null;
};

export const PERSONALITIES: Record<RafeeqId, Personality> = {
  // Steady and loyal: stands to attention, takes praise with a proud nod, never gives up.
  rider: {
    temper: "attentive",
    pet: "composed",
    fail: "determined",
    energy: 1,
    gaze: 1,
    sleepMs: 90_000,
    fidgets: ["look", "nod", "twitch", "tilt"],
    fidgetEvery: [7, 12],
    rest: null,
  },
  // Gentle and a little sleepy: goes shy when watched, melts when petted, worries for you.
  keeper: {
    temper: "shy",
    pet: "melts",
    fail: "worried",
    energy: 0.7,
    gaze: 0.8,
    sleepMs: 30_000,
    fidgets: ["yawn", "tilt", "twitch"],
    fidgetEvery: [9, 15],
    rest: "content",
  },
  // Curious and quick: leans in to see, ticklish, jumps when something goes wrong, rarely sleeps.
  scout: {
    temper: "curious",
    pet: "ticklish",
    fail: "startle",
    energy: 1.4,
    gaze: 1.6,
    sleepMs: 150_000,
    fidgets: ["look", "hop", "tilt", "look"],
    fidgetEvery: [4, 8],
    rest: "wide",
  },
  // Easygoing and dreamy: unbothered, loves a stroke, shrugs things off, naps often.
  drifter: {
    temper: "unbothered",
    pet: "melts",
    fail: "shrug",
    energy: 0.6,
    gaze: 0.5,
    sleepMs: 25_000,
    fidgets: ["yawn", "stretch", "tilt"],
    fidgetEvery: [12, 20],
    rest: "content",
  },
  // Bold and a show-off: puffs up when watched, giggles, is indignant when things fail.
  dune: {
    temper: "proud",
    pet: "giggles",
    fail: "indignant",
    energy: 1.3,
    gaze: 1,
    sleepMs: 70_000,
    fidgets: ["hop", "nod", "tilt"],
    fidgetEvery: [6, 10],
    rest: null,
  },
  // Calm and wise: glows warmly at you, content, worries softly, keeps watch into the night.
  lantern: {
    temper: "warm",
    pet: "melts",
    fail: "worried",
    energy: 0.6,
    gaze: 0.7,
    sleepMs: 60_000,
    fidgets: ["tilt", "yawn", "look"],
    fidgetEvery: [10, 16],
    rest: "content",
  },
  // Prickly but soft inside: annoyed when hovered over, grumbles at petting (then gives in).
  fennec: {
    temper: "annoyed",
    pet: "grumbles",
    fail: "startle",
    energy: 1.3,
    gaze: 1.2,
    sleepMs: 45_000,
    fidgets: ["twitch", "twitch", "look", "stomp"],
    fidgetEvery: [5, 9],
    rest: null,
  },
  // Playful and mischievous: dodges your pointer, giggles, spins off a failure, never still.
  breeze: {
    temper: "dodge",
    pet: "giggles",
    fail: "spin",
    energy: 1.5,
    gaze: 1.2,
    sleepMs: 100_000,
    fidgets: ["spin", "hop", "look"],
    fidgetEvery: [5, 9],
    rest: null,
  },
};

/** How long your pointer has rested on it: not at all, a moment, or a while. */
export type Hover = "near" | "long" | null;
/** The moods Rafeeq.tsx sets (moments), plus "grumble" for a companion that doesn't like being petted. */
export type Mood =
  "none" | "sleepy" | "waking" | "happy" | "petted" | "grumble" | "droop" | "greet" | "trick" | "celebrate";

/**
 * The face it makes now: a moment's mood first, then your pointer on it, then its own face at
 * rest. Pure, so the app and the art lab agree, and it is easy to test.
 */
export function expressionOf(id: RafeeqId, mood: Mood, hover: Hover, idle: boolean): Expression | null {
  const p = PERSONALITIES[id];
  if (mood === "grumble") return "annoyed";
  if (mood === "droop") {
    return (
      {
        worried: "worried",
        determined: "determined",
        shrug: "content",
        indignant: "annoyed",
        startle: "wide",
        spin: "giggle",
      } as const
    )[p.fail];
  }
  if (mood !== "none" || !idle) return null;
  if (hover) {
    switch (p.temper) {
      case "attentive":
        return "determined";
      case "shy":
        return "shy";
      case "curious":
        return "wide";
      case "unbothered":
        return "content";
      case "proud":
        return "smug";
      case "warm":
        return "content";
      case "annoyed":
        return hover === "long" ? "annoyed" : "wary";
      case "dodge":
        return "giggle";
    }
  }
  return p.rest;
}
