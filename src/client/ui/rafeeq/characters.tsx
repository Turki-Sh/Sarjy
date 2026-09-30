// The four companions (shared/rafeeq.ts), drawn on a 200 x 200 box, standing on its bottom edge.
// Each is layers the stylesheet can move on their own: a body that breathes, ears that perk, a
// lantern that swings, a tail that sways. Colors come from tokens.css.

import type { RafeeqId } from "@/shared/rafeeq";
import { Face } from "./Face";
import styles from "./Rafeeq.module.css";

/** Where each face sits. */
const FACE_Y: Record<RafeeqId, number> = { rider: 126, keeper: 120, scout: 136, drifter: 124 };

/** A sand dune in a red-checked shemagh and a black agal: bold and cheerful. */
function Rider({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <pattern
          id={`${uid}-shemagh`}
          width="13"
          height="13"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="13" height="13" fill="var(--rider-cloth)" />
          <path d="M0 6.5H13M6.5 0V13" stroke="var(--rider-check)" strokeOpacity=".7" strokeWidth="2.2" />
        </pattern>
      </defs>
      <g className={styles.body}>
        <path d="M38 184 C36 130 60 92 100 92 C140 92 164 130 162 184 Z" fill="var(--rider-body)" />
        <path d="M38 184 C60 174 80 178 100 172 C122 166 140 176 162 184 Z" fill="var(--rider-shade)" />
        <g className={styles.cloth}>
          <path
            d="M32 170 C28 118 58 68 100 66 C142 68 172 118 168 170 C160 150 152 132 148 124 C140 108 122 102 100 102 C78 102 60 108 52 124 C48 132 40 150 32 170 Z"
            fill={`url(#${uid}-shemagh)`}
            stroke="var(--rider-check)"
            strokeOpacity=".35"
            strokeWidth="1.5"
          />
          <path
            d="M100 66 C94 80 92 92 92 102"
            fill="none"
            stroke="var(--rider-check)"
            strokeOpacity=".35"
            strokeWidth="2"
          />
        </g>
        <path
          d="M69 84 Q100 96 131 84"
          fill="none"
          stroke="var(--rafeeq-ink)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M71 77 Q100 88 129 77"
          fill="none"
          stroke="var(--rafeeq-ink)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Face y={FACE_Y.rider} />
      </g>
    </>
  );
}

/** Keeper of what you tell Sarjy, in memory's Dusk, with a lantern that lights on every save. */
function Keeper({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0" stopColor="var(--keeper-flame)" stopOpacity=".95" />
          <stop offset="1" stopColor="var(--keeper-flame)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className={styles.lantern}>
        <circle className={styles.flame} cx="166" cy="110" r="24" fill={`url(#${uid}-glow)`} />
        <path d="M166 82 V96" stroke="var(--keeper-frame)" strokeWidth="3" strokeLinecap="round" />
        <rect
          x="156"
          y="96"
          width="20"
          height="26"
          rx="6"
          fill="var(--keeper-flame)"
          stroke="var(--keeper-frame)"
          strokeWidth="3"
        />
        <path d="M159 96 L166 89 L173 96 Z" fill="var(--keeper-frame)" />
      </g>
      <g className={styles.body}>
        <path
          d="M100 66 C142 66 158 108 158 146 C158 174 134 184 100 184 C66 184 42 174 42 146 C42 108 58 66 100 66 Z"
          fill="var(--keeper-body)"
        />
        <path
          className={styles.tuft}
          d="M96 68 C91 54 102 44 111 49 C104 52 102 58 104 67 Z"
          fill="var(--keeper-tuft)"
        />
        <path
          d="M58 150 C62 170 80 178 100 178 C120 178 138 170 142 150 C132 160 118 164 100 164 C82 164 68 160 58 150 Z"
          fill="var(--keeper-shade)"
        />
        <Face y={FACE_Y.keeper} />
      </g>
    </>
  );
}

/** A fennec, with the big ears of the desert fox: curious, perks up for every search. */
function Scout() {
  return (
    <>
      <g className={styles.tail}>
        <path
          d="M144 172 C172 176 190 154 182 130 C178 118 166 118 162 126 C170 140 164 158 144 162 Z"
          fill="var(--scout-body)"
        />
        <path d="M182 130 C178 118 166 118 162 126 C168 130 174 132 182 130 Z" fill="var(--scout-cream)" />
      </g>
      <g className={styles.body}>
        <g className={`${styles.ear} ${styles.earLeft}`}>
          <path d="M60 122 C52 98 44 66 42 42 C62 58 84 82 94 104 Z" fill="var(--scout-body)" />
          <path d="M62 112 C56 94 52 74 51 58 C64 72 78 88 86 104 Z" fill="var(--scout-cream)" />
        </g>
        <g className={`${styles.ear} ${styles.earRight}`}>
          <path d="M140 122 C148 98 156 66 158 42 C138 58 116 82 106 104 Z" fill="var(--scout-body)" />
          <path d="M138 112 C144 94 148 74 149 58 C136 72 122 88 114 104 Z" fill="var(--scout-cream)" />
        </g>
        <path d="M44 184 C40 134 62 100 100 100 C138 100 160 134 156 184 Z" fill="var(--scout-body)" />
        <path
          d="M70 172 C72 152 86 144 100 144 C114 144 128 152 130 172 C120 180 80 180 70 172 Z"
          fill="var(--scout-cream)"
        />
        <Face y={FACE_Y.scout} />
      </g>
    </>
  );
}

/** A wisp of wind-blown sand, floating beside you, dreamy, with a star for company. */
function Drifter() {
  return (
    <>
      <path
        className={styles.star}
        d="M146 60 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 Z"
        fill="var(--rafeeq-gold)"
      />
      <g className={styles.body}>
        <path
          d="M100 76 C134 76 152 104 152 132 C152 158 132 172 100 172 C80 172 66 166 58 156 C46 166 30 166 22 154 C36 156 44 148 46 136 C44 100 66 76 100 76 Z"
          fill="var(--drifter-body)"
        />
        <path
          className={styles.tail}
          d="M58 156 C46 166 30 166 22 154 C32 150 40 150 46 144"
          fill="none"
          stroke="var(--drifter-shade)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M74 100 C84 88 104 84 118 90"
          fill="none"
          stroke="var(--rafeeq-shine)"
          strokeOpacity=".55"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Face y={FACE_Y.drifter} />
      </g>
    </>
  );
}

export function Character({ id, uid }: { id: RafeeqId; uid: string }) {
  switch (id) {
    case "rider":
      return <Rider uid={uid} />;
    case "keeper":
      return <Keeper uid={uid} />;
    case "scout":
      return <Scout />;
    case "drifter":
      return <Drifter />;
  }
}

/** Where the face sits, for overlays that belong near it (hearts, thought dots). */
export const faceY = (id: RafeeqId) => FACE_Y[id];
