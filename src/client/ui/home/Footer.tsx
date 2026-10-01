// The foot of the home page: the logo, the tagline in the brand's voice, who made it, and the
// version it is on (worked out at build time in next.config.ts), linked to its commit.

import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import { Logo } from "../brand/Logo";
import styles from "./Home.module.css";

const VERSION = process.env.SARJY_VERSION;
const COMMIT = process.env.SARJY_COMMIT;

export function Footer({ lang }: { lang: Lang }) {
  const s = HOME[lang].footer;
  return (
    <footer className={styles.footer}>
      <div className={styles.footInner}>
        <Logo lang={lang} className={styles.footLogo} />
        <p className={`${styles.footTagline} ${styles.voice}`}>{s.tagline}</p>
        <p className={styles.made}>
          {s.made}
          {VERSION && (
            <>
              {" "}
              <a
                className={styles.version}
                href={`https://github.com/Turki-Sh/Sarjy/commit/${COMMIT}`}
                title={COMMIT}
                dir="ltr"
              >
                v{VERSION}
              </a>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
