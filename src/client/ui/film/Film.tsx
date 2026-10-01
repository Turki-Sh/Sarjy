// The film page (Day 5): Turki's short film, played by the browser itself, with the way into the
// app under it. Nothing here needs JavaScript: the video element brings its own controls.

import Link from "next/link";
import type { Lang } from "@/shared/i18n";
import { dir } from "@/shared/i18n";
import { FILM, FILM_SRC } from "@/shared/film-copy";
import { TALK } from "@/shared/site";
import { Logo } from "../brand/Logo";
import styles from "./Film.module.css";

export function Film({ lang, poster }: { lang: Lang; poster: string }) {
  const s = FILM[lang];
  return (
    <main className={styles.film} lang={lang} dir={dir(lang)}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label={s.home}>
          <Logo lang={lang} className={styles.logo} />
        </Link>
      </header>
      <div className={styles.screen}>
        <video
          className={styles.video}
          src={FILM_SRC}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          aria-label={s.label}
        />
      </div>
      <section className={styles.words}>
        <h1 className={styles.title}>{s.title}</h1>
        <p className={styles.body}>{s.body}</p>
        <div className={styles.actions}>
          <Link href={TALK} className={styles.primary}>
            {s.talk}
          </Link>
          <Link href="/" className={styles.secondary}>
            {s.home}
          </Link>
        </div>
      </section>
    </main>
  );
}
