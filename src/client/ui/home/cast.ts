// Who plays what on the home page. Your own Rafeeq, if you picked one, takes the best spot (sitting
// on the headline, beside "rider."); the others fill the rest. Plain logic.

import { RAFEEQS, type RafeeqId } from "@/shared/rafeeq";

export type HomeCast = {
  /** Sits on the headline, beside "rider.". */
  perch: RafeeqId;
  /** Peeks over the first line (annoyed if you stare). */
  peek: RafeeqId;
  /** Drifts past the headline. */
  float: RafeeqId;
  /** Walk the dunes below. */
  caravan: RafeeqId[];
};

export function castHome(yours: RafeeqId | null): HomeCast {
  const perch = yours ?? "rider";
  const peek: RafeeqId = perch === "fennec" ? "scout" : "fennec";
  const float: RafeeqId = perch === "breeze" ? "lantern" : "breeze";
  const caravan = RAFEEQS.filter((id) => id !== perch && id !== peek && id !== float);
  return { perch, peek, float, caravan };
}
