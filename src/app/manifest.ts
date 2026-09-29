// The web app manifest: lets Sarjy install to a home screen with the green tile icon.

import type { MetadataRoute } from "next";
import { COLORS } from "@/shared/brand/colors";
import { t } from "@/shared/i18n";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sarjy · سرجي",
    short_name: "Sarjy",
    description: t("en").description,
    start_url: "/",
    display: "standalone",
    background_color: COLORS.white,
    theme_color: COLORS.white,
    lang: "en",
    dir: "auto",
    categories: ["lifestyle", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
