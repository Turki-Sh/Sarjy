// The root layout. It reads the saved theme and language from cookies, so the server renders
// the right colors and direction on the first paint, and it declares the site's metadata.

import type { Metadata, Viewport } from "next";
import { readPreferences } from "@/server/preferences";
import { refractScale } from "@/shared/preferences";
import { dir, t } from "@/shared/i18n";
import { SITE_NAME, siteUrl } from "@/shared/site";
import { fontVariables } from "./fonts";
import "@/styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await readPreferences();
  const s = t(lang);
  // Just the name, in both scripts: the description says what it is.
  const title = lang === "ar" ? "سرجي · Sarjy" : "Sarjy · سرجي";
  return {
    metadataBase: siteUrl(),
    title: { default: title, template: `%s · ${lang === "ar" ? "سرجي" : SITE_NAME}` },
    description: s.description,
    applicationName: SITE_NAME,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description: s.description,
      url: "/",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      alternateLocale: lang === "ar" ? ["en_US"] : ["ar_SA"],
    },
    twitter: { card: "summary_large_image", title, description: s.description },
    appleWebApp: { title: SITE_NAME, capable: true, statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

// Structured data so search engines know what Sarjy is.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  alternateName: "سرجي",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  inLanguage: ["en", "ar"],
  description: t("en").description,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

/**
 * Runs before paint. While the theme choice is "system", it matches the device, and keeps matching
 * it when the device switches (checked at each change, so choosing System later also follows).
 */
const FOLLOW_DEVICE = `(function(){var d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");var f=function(){if(d.dataset.themeChoice==="system")d.dataset.theme=m.matches?"dark":"light"};f();m.addEventListener("change",f)})()`;

/** Marks browsers that can bend the backdrop through an SVG filter (Chrome, Edge, Opera, Arc). */
const DETECT_REFRACTION = `(function(){var b=navigator.userAgentData&&navigator.userAgentData.brands;if(b&&b.some(function(x){return /Chromium/.test(x.brand)}))document.documentElement.dataset.refract="on"})()`;

/**
 * The refraction used by liquid glass (styles/glass.css): soft, low-frequency noise displaces the
 * backdrop, so what is behind the glass wavers like light through water. Its strength follows the
 * Glass setting (Settings updates the scale live).
 */
function RefractionFilter({ scale }: { scale: number }) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <filter id="sarjy-refract" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.011 0.016"
          numOctaves={2}
          seed={4}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation={3} result="soft" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="soft"
          scale={scale}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, theme, themeChoice, glass, glassSet } = await readPreferences();
  return (
    <html
      lang={lang}
      dir={dir(lang)}
      data-theme={theme}
      data-theme-choice={themeChoice}
      className={fontVariables}
      // How much liquid glass (Settings, Appearance), rendered by the server so the first paint is right.
      style={{ ["--liquid" as string]: String(glass / 100) }}
      data-glass={glassSet ? "set" : undefined}
      // The two scripts below adjust data-theme and data-refract before paint, on purpose.
      suppressHydrationWarning
    >
      <head>
        {/* "Follow my device": pick light or dark before the first paint, so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: FOLLOW_DEVICE }} />
        {/* Refraction needs SVG filters inside backdrop-filter, which only Chromium draws. */}
        <script dangerouslySetInnerHTML={{ __html: DETECT_REFRACTION }} />
      </head>
      <body>
        <RefractionFilter scale={refractScale(glass)} />
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
