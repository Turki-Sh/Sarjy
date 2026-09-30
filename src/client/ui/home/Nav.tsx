"use client";

// The home page's bar: the logo, the sections, English or Arabic, light or dark, and the way in.
// It turns to glass once you scroll. Language and theme are the same cookies the voice screen
// uses, so a choice made here is there when you start talking.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Lang } from "@/shared/i18n";
import { dir } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import { COOKIE } from "@/shared/preferences";
import { TALK } from "@/shared/site";
import { Logo } from "../brand/Logo";
import { Icon } from "../Icon";
import styles from "./Home.module.css";

const YEAR = 60 * 60 * 24 * 365;
const remember = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
};

export function Nav({ lang }: { lang: Lang }) {
  const s = HOME[lang].nav;
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const switchLang = () => {
    const next: Lang = lang === "ar" ? "en" : "ar";
    remember(COOKIE.lang, next);
    document.documentElement.lang = next;
    document.documentElement.dir = dir(next);
    router.refresh();
  };
  const switchTheme = () => {
    const html = document.documentElement;
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    remember(COOKIE.theme, next);
    html.dataset.themeChoice = next;
    html.dataset.theme = next;
  };

  return (
    <header className={styles.nav} data-scrolled={scrolled || undefined}>
      <Link href="/" className={styles.brand} aria-label="Sarjy">
        <Logo lang={lang} className={styles.logo} />
      </Link>
      <nav className={styles.links} aria-label="Sarjy">
        <a href="#promise">{s.promise}</a>
        <a href="#day">{s.day}</a>
        <a href="#rafeeqs">{s.rafeeqs}</a>
        <a href="#majlis">{s.majlis}</a>
        <a href="/handbook">{s.handbook}</a>
      </nav>
      <div className={styles.tools}>
        <button type="button" className={styles.tool} onClick={switchLang} lang={lang === "ar" ? "en" : "ar"}>
          {s.otherLang}
        </button>
        <button type="button" className={`${styles.tool} ${styles.icon}`} onClick={switchTheme}>
          <Icon name="moon" className={styles.moonIcon} />
          <Icon name="sun" className={styles.sunIcon} />
          <span className={styles.visuallyHidden}>
            <span className={styles.toDark}>{s.dark}</span>
            <span className={styles.toLight}>{s.light}</span>
          </span>
        </button>
        <Link href={TALK} className={styles.navTalk}>
          {s.talk}
        </Link>
      </div>
    </header>
  );
}
