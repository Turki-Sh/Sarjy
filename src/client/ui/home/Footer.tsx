// The foot of the home page: the tagline in the brand's voice, the way in, the handbook, and who
// made it.

import Link from "next/link";
import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import { TALK } from "@/shared/site";
import { Logo } from "../brand/Logo";
import styles from "./Home.module.css";

export function Footer({ lang }: { lang: Lang }) {
  const s = HOME[lang].footer;
  return (
    <footer className={styles.footer}>
      <div className={styles.footInner}>
        <Logo lang={lang} className={styles.footLogo} />
        <p className={`${styles.footTagline} ${styles.voice}`}>{s.tagline}</p>
        <nav className={styles.footLinks} aria-label={s.tagline}>
          <Link href={TALK}>{s.talk}</Link>
          <a href="/handbook">{s.handbook}</a>
        </nav>
        <p className={styles.made}>{s.made}</p>
      </div>
    </footer>
  );
}
