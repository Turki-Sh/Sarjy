"use client";

// The day's timeline: hour ticks from 5 in the morning to midnight, a dot for each moment, and a
// pill with the time and arrows either side. Grab it anywhere and drag: the pill follows your
// finger smoothly through the hours (and the sun moves with it), the moment changes as you pass
// each one, and when you let go it settles on the nearest. Or click, or use the arrow keys. It
// runs with the reading direction, so in Arabic the day flows from right to left.

import { useRef, useState } from "react";
import type { DayStop } from "@/shared/home-copy";
import { Icon } from "../Icon";
import styles from "./Day.module.css";

const FIRST = 5;
const LAST = 24;
const place = (at: number) => ((at - FIRST) / (LAST - FIRST)) * 100;

type Props = {
  stops: readonly DayStop[];
  index: number;
  onChange: (i: number) => void;
  /** Where the pointer is while dragging, in hours; null once let go. */
  onScrub: (hour: number | null) => void;
  labels: { earlier: string; later: string; slider: string };
};

export function Timeline({ stops, index, onChange, onScrub, labels }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [dragAt, setDragAt] = useState<number | null>(null);
  const stop = stops[index]!;
  const at = place(dragAt ?? stop.at);

  const rtl = () => getComputedStyle(track.current!).direction === "rtl";
  /** The hour under the pointer, along the track. */
  const hourAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return FIRST + (rtl() ? 1 - f : f) * (LAST - FIRST);
  };
  const nearest = (hour: number) =>
    stops.reduce((best, s, i) => (Math.abs(s.at - hour) < Math.abs(stops[best]!.at - hour) ? i : best), 0);

  const follow = (clientX: number) => {
    const hour = hourAt(clientX);
    setDragAt(hour);
    onScrub(hour);
    const i = nearest(hour);
    if (i !== index) onChange(i);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    track.current!.setPointerCapture(e.pointerId);
    follow(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (track.current!.hasPointerCapture(e.pointerId)) follow(e.clientX);
  };
  const letGo = () => {
    setDragAt(null);
    onScrub(null);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const back = rtl() ? "ArrowRight" : "ArrowLeft";
    const on = rtl() ? "ArrowLeft" : "ArrowRight";
    if (e.key === back || e.key === "ArrowDown") onChange(Math.max(0, index - 1));
    else if (e.key === on || e.key === "ArrowUp") onChange(Math.min(stops.length - 1, index + 1));
    else if (e.key === "Home") onChange(0);
    else if (e.key === "End") onChange(stops.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className={styles.timeline}>
      <div
        ref={track}
        className={styles.track}
        data-dragging={dragAt !== null || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={letGo}
        onPointerCancel={letGo}
      >
        {Array.from({ length: (LAST - FIRST) * 2 + 1 }, (_, i) => (
          <span
            key={i}
            className={styles.tick}
            data-hour={i % 2 === 0 || undefined}
            style={{ insetInlineStart: `${(i / ((LAST - FIRST) * 2)) * 100}%` }}
          />
        ))}
        {stops.map((s, i) => (
          <span
            key={s.at}
            className={styles.stopDot}
            data-on={i === index || undefined}
            style={{ insetInlineStart: `${place(s.at)}%` }}
          />
        ))}
        <span className={styles.needle} style={{ insetInlineStart: `${at}%` }} />
        <div className={styles.pill} style={{ insetInlineStart: `${at}%` }}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => onChange(index - 1)}
            disabled={index === 0}
            aria-label={labels.earlier}
          >
            <Icon name="chev" className={styles.back} />
          </button>
          <span
            role="slider"
            tabIndex={0}
            className={styles.time}
            aria-label={labels.slider}
            aria-valuemin={0}
            aria-valuemax={stops.length - 1}
            aria-valuenow={index}
            aria-valuetext={`${stop.time}, ${stop.label}`}
            onKeyDown={onKeyDown}
          >
            {stop.time}
          </span>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => onChange(index + 1)}
            disabled={index === stops.length - 1}
            aria-label={labels.later}
          >
            <Icon name="chev" className={styles.on} />
          </button>
        </div>
      </div>
    </div>
  );
}
