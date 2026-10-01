// The foot of the home page: the logo, the tagline in the brand's voice, and who made it.

import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import { Logo } from "../brand/Logo";
import styles from "./Home.module.css";

export function Footer({ lang }: { lang: Lang }) {
  const s = HOME[lang].footer;
  return (
    <footer className={styles.footer}>
      <div className={styles.footInner}>
        <Logo lang={lang} className={styles.footLogo} />
        <p className={`${styles.footTagline} ${styles.voice}`}>{s.tagline}</p>
        <p className={styles.made}>{s.made}</p>
      </div>
    </footer>
  );
}
