// A shared moment: one exchange with Sarjy, as its owner chose to share it.
// Its link preview is one of the illustrated cards, picked by what the moment was about.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/client/ui/brand/Logo";
import { getDb } from "@/server/db/client";
import { readPreferences } from "@/server/preferences";
import { getShare } from "@/server/share/repo";
import { t } from "@/shared/i18n";
import { cardImage, pickCard, type CardKind } from "@/shared/og";
import styles from "./share.module.css";

type Props = { params: Promise<{ code: string }> };

async function load(code: string) {
  return getShare(await getDb(), code);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const share = await load(code);
  if (!share) return { title: "Not found", robots: { index: false } };
  const lang = share.lang === "ar" ? "ar" : "en";
  const card = cardImage(pickCard(share.kind as CardKind, lang, code));
  const title = lang === "ar" ? "لحظة مع سرجي" : "A moment with Sarjy";
  const description = share.answer.slice(0, 160);
  return {
    title,
    description,
    // Link-only: shared on purpose, but not meant to be found by search.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "article", images: [card], url: `/s/${code}` },
    twitter: { card: "summary_large_image", title, description, images: [card] },
  };
}

export default async function SharedMoment({ params }: Props) {
  const { code } = await params;
  const share = await load(code);
  if (!share) notFound();

  const { lang: uiLang } = await readPreferences();
  const s = t(uiLang);
  const lang = share.lang === "ar" ? "ar" : "en";
  const dir = lang === "ar" ? "rtl" : "ltr";
  const when = new Intl.DateTimeFormat(uiLang === "ar" ? "ar-SA" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(share.createdAt);

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.brand} aria-label="Sarjy">
        <Logo lang={uiLang} className={styles.logo} />
      </Link>

      <article className={styles.card}>
        <p className={styles.meta}>
          {s.sharedMoment} · <time dateTime={share.createdAt.toISOString()}>{when}</time>
        </p>
        <p className={styles.user} lang={lang} dir={dir}>
          {share.question}
        </p>
        {share.toolLabel && (
          <p className={styles.chip} dir="ltr">
            {share.toolLabel}
          </p>
        )}
        <p className={styles.sarjy} lang={lang} dir={dir}>
          {share.answer}
        </p>
      </article>

      <Link href="/" className={styles.cta}>
        {s.talk}
      </Link>
      <p className={styles.note}>{s.sharedNote}</p>
    </main>
  );
}
