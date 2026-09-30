import "server-only";

// Which transport carries room events: Ably when it is configured for live use, else the local bus.

import { env } from "../env";
import { ablyRealtime } from "./ably";
import { localRealtime } from "./local";
import type { Realtime } from "./types";

export type { Realtime } from "./types";

let ably: Realtime | null = null;

export function getRealtime(): Realtime {
  if (env.providers === "live" && env.ABLY_API_KEY) return (ably ??= ablyRealtime(env.ABLY_API_KEY));
  return localRealtime;
}
