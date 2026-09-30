// The 404's scenes (Turki, Day 4: "some Rafeeqs getting lost, maybe it shuffles each time people
// enter; a campfire; maybe they fight each other in a cute way"). Each visit draws a scene and a
// cast from a seed the server picks, so the page renders the same on both sides. Roles go by
// personality, not at random: the sleepiest dozes by the fire, the two liveliest squabble, the
// keenest-eyed keeps a lookout, the worrier worries.
// Plain logic, no React: the page (Lost.tsx) stages it.

import { PERSONALITIES, RAFEEQS, type RafeeqId } from "@/shared/rafeeq";
import { seeded, shuffled } from "@/shared/random";

export const VIGNETTES = ["campfire", "squabble", "circles", "map"] as const;
export type VignetteKind = (typeof VIGNETTES)[number];

export type Role =
  | "storyteller"
  | "listener"
  | "sleeper"
  | "fighterA"
  | "fighterB"
  | "worrier"
  | "lookout"
  | "circler"
  | "holder"
  | "pointerL"
  | "pointerR";

export type Vignette = { kind: VignetteKind; seed: number; cast: Partial<Record<Role, RafeeqId>> };

/** How many play in each scene, and the roles, in the order they are cast. */
const ROLES: Record<VignetteKind, readonly Role[]> = {
  campfire: ["sleeper", "storyteller", "listener", "lookout"],
  squabble: ["sleeper", "fighterA", "fighterB", "worrier"],
  circles: ["sleeper", "lookout", "circler"],
  map: ["sleeper", "holder", "pointerL", "pointerR"],
};

/** Who suits a role best, among those still free. */
function best(role: Role, free: RafeeqId[]): RafeeqId {
  const p = (id: RafeeqId) => PERSONALITIES[id];
  const by = (score: (id: RafeeqId) => number) => [...free].sort((a, b) => score(b) - score(a))[0]!;
  switch (role) {
    case "sleeper":
      return by((id) => -p(id).sleepMs);
    case "lookout":
      return by((id) => p(id).gaze);
    case "fighterA":
    case "fighterB":
    case "circler":
    case "storyteller":
      return by((id) => p(id).energy);
    case "worrier":
      return by((id) => (p(id).fail === "worried" ? 1 : 0));
    default:
      return free[0]!;
  }
}

/** A scene and its cast from a seed; `avoid` skips the scene you just saw. */
export function castScene(seed: number, avoid?: VignetteKind): Vignette {
  const rand = seeded(seed);
  const kinds = VIGNETTES.filter((k) => k !== avoid);
  const kind = kinds[Math.floor(rand() * kinds.length)]!;
  const roles = ROLES[kind];
  // A random company of the right size, then each role to whoever in it suits it best.
  const free = shuffled(RAFEEQS, rand).slice(0, roles.length);
  const cast: Vignette["cast"] = {};
  for (const role of roles) {
    const id = best(role, free);
    cast[role] = id;
    free.splice(free.indexOf(id), 1);
  }
  return { kind, seed, cast };
}
