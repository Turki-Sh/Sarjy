"use client";

// The day's timeline: hour ticks from 5 in the morning to midnight, a dot for each moment, and a
// pill that sits on the current one with its time and arrows either side. Drag along it (it
// snaps to the nearest moment), click it, or use the arrow keys on the pill. It runs with the
// reading direction, so in Arabic the day flows from right to left.

import { useRef } from "react";
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
  playing: boolean;
  onToggle: () => void;
  labels: { play: string; pause: string; earlier: string; later: string; slider: string };
};

export function Timeline({ stops, index, onChange, playing, onToggle, labels }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const stop = stops[index]!;

  /** The moment nearest to where the pointer is along the track. */
  const nearest = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    let f = (clientX - r.left) / r.width;
    if (getComputedStyle(track.current!).direction === "rtl") f = 1 - f;
    const hour = FIRST + f * (LAST - FIRST);
    let best = 0;
    stops.forEach((s, i) => {
      if (Math.abs(s.at - hour) < Math.abs(stops[best]!.at - hour)) best = i;
    });
    return best;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    track.current!.setPointerCapture(e.pointerId);
    onChange(nearest(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!track.current!.hasPointerCapture(e.pointerId)) return;
    const i = nearest(e.clientX);
    if (i !== index) onChange(i);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const rtl = getComputedStyle(track.current!).direction === "rtl";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const on = rtl ? "ArrowLeft" : "ArrowRight";
    if (e.key === back || e.key === "ArrowDown") onChange(index - 1);
    else if (e.key === on || e.key === "ArrowUp") onChange(index + 1);
    else if (e.key === "Home") onChange(0);
    else if (e.key === "End") onChange(stops.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className={styles.timeline}>
      <button type="button" className={styles.play} onClick={onToggle} aria-pressed={playing}>
        {playing ? (
          <span className={styles.pauseIcon} aria-hidden="true" />
        ) : (
          <Icon name="play" className={styles.playIcon} />
        )}
        <span>{playing ? labels.pause : labels.play}</span>
      </button>
      <div ref={track} className={styles.track} onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
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
        <span className={styles.needle} style={{ insetInlineStart: `${place(stop.at)}%` }} />
        <div className={styles.pill} style={{ insetInlineStart: `${place(stop.at)}%` }}>
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
