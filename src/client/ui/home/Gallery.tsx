"use client";

// The eight Rafeeqs, as a gallery you walk through: on a wide screen the page scrolls down and
// the gallery slides sideways (the section is as tall as the gallery is wide); on a phone you
// swipe. Each companion gets a room of its own: its name (and its name in the other script), its
// traits and story, and itself, alive (rest your pointer on it, stroke it).
// "Ride with ..." picks it and takes you to talk.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import { RAFEEQS } from "@/shared/rafeeq";
import type { Visitor } from "@/shared/visitor";
import { Rafeeq } from "../rafeeq/Rafeeq";
import { useScrollProgress } from "../scene/hooks";
import styles from "./Gallery.module.css";
import home from "./Home.module.css";
import { pickRafeeq } from "./pick";

export function Gallery({ lang, visitor }: { lang: Lang; visitor: Visitor | null }) {
  const s = HOME[lang].rafeeqs;
  const r = t(lang).rafeeq;
  const other = t(lang === "ar" ? "en" : "ar").rafeeq.names;
  const router = useRouter();

  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(root);
  // How far the gallery slides: its width beyond the window. Measured, and again on resize.
  const [travel, setTravel] = useState(0);
  useEffect(() => {
    const measure = () => {
      const el = track.current;
      if (!el) return;
      const sliding = getComputedStyle(el).getPropertyValue("--slides").trim() === "1";
      setTravel(sliding ? Math.max(0, el.scrollWidth - window.innerWidth) : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  // It holds still a moment at each end, so the first and last rooms can be seen whole.
  const along = Math.min(1, Math.max(0, (progress - 0.05) / 0.9));
  const shift = travel * along * (lang === "ar" ? 1 : -1);

  return (
    <section
      id="rafeeqs"
      ref={root}
      className={styles.gallery}
      style={{ "--travel": `${travel}px` } as CSSProperties}
      aria-labelledby="rafeeqs-title"
    >
      <div className={styles.sticky}>
        <div ref={track} className={styles.track} style={{ translate: `${shift}px 0` }}>
          <div className={styles.intro}>
            <p className={home.kicker}>{s.kicker}</p>
            <h2 id="rafeeqs-title" className={home.h2}>
              {s.title}
            </h2>
            <p className={home.lede}>{s.lede}</p>
          </div>
          {RAFEEQS.map((id) => {
            const yours = visitor?.rafeeq === id;
            return (
              <article key={id} className={styles.room} data-rafeeq={id} aria-labelledby={`room-${id}`}>
                <div className={styles.figure}>
                  <span className={styles.halo} />
                  <span className={styles.plinth} />
                  <div className={styles.live}>
                    <Rafeeq id={id} state="idle" level={yours ? visitor!.level : 4} />
                  </div>
                </div>
                <div className={styles.label}>
                  <h3 id={`room-${id}`} className={styles.name}>
                    {r.names[id]}{" "}
                    <span className={styles.otherName} lang={lang === "ar" ? "en" : "ar"}>
                      {other[id]}
                    </span>
                  </h3>
                  <p className={styles.traits}>{r.traits[id]}</p>
                  <p className={styles.story}>{r.stories[id]}</p>
                  {yours ? (
                    <p className={styles.yours}>{s.yours}</p>
                  ) : (
                    <button
                      type="button"
                      className={styles.ride}
                      onClick={() => void pickRafeeq(id, router.push)}
                    >
                      {s.ride(r.names[id])}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
