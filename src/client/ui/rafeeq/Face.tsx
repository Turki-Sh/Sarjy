// The face every Rafeeq shares (Turki, Day 3): round eyes with a shine, soft blush, and a cat's
// mouth (ω) with a small open mouth under it that opens as Sarjy speaks. Every eye shape is drawn
// once; the mood and state (Rafeeq.module.css) decide which one shows, so nothing re-renders.

import styles from "./Rafeeq.module.css";

export function Face({ y }: { y: number }) {
  const eye = (x: number) => (
    <g className={styles.eye} style={{ transformOrigin: `${x}px ${y}px` }}>
      <ellipse cx={x} cy={y} rx="7.5" ry="9.5" fill="var(--rafeeq-ink)" />
      <circle cx={x + 2.5} cy={y - 3.5} r="2.6" fill="var(--rafeeq-shine)" />
    </g>
  );
  // ^ ^ when happy, ‿ ‿ when asleep, > < when startled.
  const arc = (x: number, d: string) => <path d={`M${x - 8} ${y + 1} ${d}`} />;
  return (
    <g className={styles.face}>
      <g className={styles.open}>
        {eye(82)}
        {eye(118)}
      </g>
      <g className={styles.happy}>
        {arc(82, "q8 -10 16 0")}
        {arc(118, "q8 -10 16 0")}
      </g>
      <g className={styles.closed}>
        {arc(82, "q8 7 16 0")}
        {arc(118, "q8 7 16 0")}
      </g>
      <ellipse className={styles.blush} cx="68" cy={y + 13} rx="7" ry="4" />
      <ellipse className={styles.blush} cx="132" cy={y + 13} rx="7" ry="4" />
      <path className={styles.mouth} d={`M92 ${y + 14} q4 5 8 0 q4 5 8 0`} />
      <g className={styles.talk} style={{ transformOrigin: `100px ${y + 17}px` }}>
        <ellipse cx="100" cy={y + 21} rx="5.5" ry="5" fill="var(--rafeeq-ink)" />
        <ellipse cx="100" cy={y + 23.5} rx="3.2" ry="2" fill="var(--rafeeq-blush)" />
      </g>
    </g>
  );
}
