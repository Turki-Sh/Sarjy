// The root layout. It reads the saved theme and language from cookies, so the server renders
// the right colors and direction on the first paint, and it declares the site's metadata.

import type { Metadata, Viewport } from "next";
import { readPreferences } from "@/server/preferences";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, theme, themeChoice } = await readPreferences();
  return (
    <html
      lang={lang}
      dir={dir(lang)}
      data-theme={theme}
      data-theme-choice={themeChoice}
      className={fontVariables}
    >
      <head>
        {/* "Follow my device": pick light or dark before the first paint, so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: FOLLOW_DEVICE }} />
      </head>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
