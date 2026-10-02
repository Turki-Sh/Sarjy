"use client";

// The screen: the browser's own player, a glow of the film's colors behind it (its poster, blurred),
// and under it how long it runs, what language it is in, and, when the film comes in more than
// one, the choice of version. The versions are the same cut, so switching keeps your place (and
// keeps playing if it was). The choice goes in the address (?v=en), so a shared link opens on it.
// Share hands the film's own link (with the version, when there is a choice) to the phone's share
// sheet, or copies it where there is none, and says so.

import { useEffect, useRef, useState } from "react";
import type { FilmEntry } from "@/shared/films";
import { filmHref, runningTime } from "@/shared/films";
import { FILM } from "@/shared/film-copy";
import type { Lang } from "@/shared/i18n";
import { Icon } from "../Icon";
import { useDaylight } from "../home/theme";
import styles from "./Film.module.css";

type Props = { lang: Lang; film: FilmEntry; initial: Lang; landing?: boolean };

export function FilmPlayer({ lang, film, initial, landing = false }: Props) {
  const s = FILM[lang];
  // Day and night by the clock, as on the home page (the bar's switch overrides it).
  useDaylight();
  const [current, setCurrent] = useState<Lang>(initial);
  const version = film.versions.find((v) => v.lang === current) ?? film.versions[0]!;
  const video = useRef<HTMLVideoElement>(null);
  const resume = useRef<{ at: number; playing: boolean } | null>(null);

  const choose = (next: Lang) => {
    if (next === version.lang) return;
    const v = video.current;
    resume.current = v ? { at: v.currentTime, playing: !v.paused && !v.ended } : null;
    setCurrent(next);
    const url = new URL(window.location.href);
    url.searchParams.set("v", next);
    window.history.replaceState(window.history.state, "", url);
  };

  // Arrived at /film: the address becomes this film's own (the page is the same), so the link you
  // copy from the address bar is the film's. /film keeps its own card for whoever shares it as is.
  useEffect(() => {
    if (!landing) return;
    window.history.replaceState(window.history.state, "", `${filmHref(film)}${window.location.search}`);
  }, [landing, film]);

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);
  const share = async () => {
    const url = new URL(filmHref(film), window.location.origin);
    if (film.versions.length > 1) url.searchParams.set("v", version.lang);
    const link = url.toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: film.title[lang], text: film.body[lang], url: link });
        return;
      } catch (e) {
        // Closed the sheet: nothing to do. Anything else: fall back to copying.
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt(s.share, link);
    }
  };

  // The new version has loaded: back to where you were.
  const onLoaded = () => {
    const v = video.current;
    const r = resume.current;
    if (!v || !r) return;
    resume.current = null;
    if (r.at > 0) v.currentTime = r.at;
    if (r.playing) void v.play().catch(() => {});
  };

  return (
    <div className={styles.player}>
      <div className={styles.glow} style={{ backgroundImage: `url(${version.poster})` }} aria-hidden="true" />
      <div className={styles.screen}>
        <video
          ref={video}
          className={styles.video}
          src={version.src}
          poster={version.poster}
          controls
          playsInline
          preload="metadata"
          aria-label={film.title[lang]}
          onLoadedMetadata={onLoaded}
        />
      </div>
      <div className={styles.bar}>
        <p className={styles.meta}>
          <span dir="ltr">{runningTime(film.seconds)}</span>
          <span aria-hidden="true">·</span>
          <span>{s.spoken(version.lang, version.subtitles)}</span>
        </p>
        <div className={styles.tools}>
          <button type="button" className={styles.share} onClick={share} data-copied={copied || undefined}>
            <Icon name={copied ? "check" : "share"} />
            <span aria-live="polite">{copied ? s.copied : s.share}</span>
          </button>
          {film.versions.length > 1 && (
            <div className={styles.versions} role="group" aria-label={s.watchIn}>
              <span className={styles.versionsLabel}>{s.watchIn}</span>
              {film.versions.map((v) => (
                <button
                  key={v.lang}
                  type="button"
                  className={styles.version}
                  aria-pressed={v.lang === version.lang}
                  lang={v.lang}
                  onClick={() => choose(v.lang)}
                >
                  {s.langName[v.lang]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
