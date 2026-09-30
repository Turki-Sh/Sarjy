// Where everyone stands in each 404 scene and what they're doing, moment by moment. Positions are
// percent of the stage (feet), sizes percent of its width (Actor.tsx). The squabble plays in three
// beats that loop: a brawl in a dust cloud, a sulk back to back with the map torn in two, making
// up. Plain data from a vignette and a beat; Lost.tsx draws it.

import type { Mood, RafeeqId } from "@/shared/rafeeq";
import type { VoiceState } from "@/shared/states";
import type { Role, Vignette } from "./vignettes";

export type Placed = {
  role: Role;
  id: RafeeqId;
  x: number;
  y: number;
  size: number;
  facing: 1 | -1;
  z?: number;
  act?: Mood | null;
  state?: VoiceState;
  /** Brawling in the dust cloud. */
  brawl?: boolean;
  /** Walking in circles (the footprints give it away). */
  circling?: boolean;
};

export type Staging = {
  fire: number;
  actors: Placed[];
  /** A dust cloud (the brawl), at this x. */
  cloud?: number;
  /** The map: held upside down, or torn in two. */
  map?: { x: number; y: number; torn?: boolean; upsideDown?: boolean };
  /** Footprints walking in a loop, around this x. */
  loop?: number;
  /** Who speaks, in turn (bubbles). */
  speakers: Role[];
};

/** The squabble's beats, and how long each lasts. */
export const BEATS = [
  { name: "fight", ms: 5200 },
  { name: "sulk", ms: 4600 },
  { name: "makeUp", ms: 4200 },
] as const;
export type Beat = (typeof BEATS)[number]["name"];

export function stage(v: Vignette, beat: Beat): Staging {
  const c = v.cast;
  const at = (role: Role, p: Omit<Placed, "role" | "id">): Placed[] =>
    c[role] ? [{ role, id: c[role], ...p }] : [];

  switch (v.kind) {
    case "campfire":
      return {
        fire: 50,
        actors: [
          ...at("sleeper", { x: 16, y: 90, size: 10, facing: 1, act: "sleepy" }),
          ...at("storyteller", { x: 35, y: 90, size: 12.5, facing: 1 }),
          ...at("listener", { x: 65, y: 90, size: 12, facing: -1 }),
          ...at("lookout", { x: 84, y: 50, size: 6.5, facing: -1, state: "tool" }),
        ],
        speakers: ["storyteller", "listener", "lookout", "storyteller", "sleeper"],
      };
    case "squabble": {
      const fighters: Placed[] =
        beat === "fight"
          ? [
              ...at("fighterA", { x: 66, y: 86, size: 12, facing: 1, act: "grumble", brawl: true }),
              ...at("fighterB", { x: 76, y: 86, size: 12, facing: -1, act: "grumble", brawl: true }),
            ]
          : beat === "sulk"
            ? [
                ...at("fighterA", { x: 60, y: 90, size: 12, facing: -1, act: "grumble" }),
                ...at("fighterB", { x: 84, y: 90, size: 12, facing: 1, act: "grumble" }),
              ]
            : [
                ...at("fighterA", { x: 65, y: 90, size: 12, facing: 1, act: "petted" }),
                ...at("fighterB", { x: 77, y: 90, size: 12, facing: -1, act: "petted" }),
              ];
      return {
        fire: 30,
        actors: [
          ...at("sleeper", { x: 16, y: 90, size: 11, facing: 1, act: "sleepy" }),
          ...at("worrier", { x: 43, y: 90, size: 11, facing: 1, act: beat === "makeUp" ? null : "droop" }),
          ...fighters,
        ],
        cloud: beat === "fight" ? 71 : undefined,
        map: beat === "sulk" ? { x: 72, y: 90, torn: true } : undefined,
        speakers: ["fighterA", "fighterB"],
      };
    }
    case "circles":
      return {
        fire: 34,
        actors: [
          ...at("sleeper", { x: 22, y: 90, size: 11, facing: 1, act: "sleepy" }),
          ...at("lookout", { x: 85, y: 47, size: 7, facing: -1, state: "tool" }),
          ...at("circler", { x: 66, y: 86, size: 10, facing: 1, circling: true }),
        ],
        loop: 66,
        speakers: ["lookout", "circler", "sleeper"],
      };
    case "map":
      return {
        fire: 24,
        actors: [
          ...at("sleeper", { x: 11, y: 90, size: 10, facing: 1, act: "sleepy" }),
          ...at("pointerL", { x: 42, y: 90, size: 11, facing: -1 }),
          ...at("holder", { x: 58, y: 90, size: 12.5, facing: 1, state: "thinking" }),
          ...at("pointerR", { x: 76, y: 90, size: 11, facing: 1 }),
        ],
        map: { x: 58, y: 99, upsideDown: true },
        speakers: ["pointerL", "pointerR", "holder", "pointerL", "pointerR", "sleeper"],
      };
  }
}
