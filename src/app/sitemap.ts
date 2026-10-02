import type { MetadataRoute } from "next";
import { FILMS, filmHref } from "@/shared/films";
import { siteUrl, TALK } from "@/shared/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl().toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL(TALK, siteUrl()).toString(), changeFrequency: "weekly", priority: 0.8 },
    // Every film at its own address (/film itself only sends you to the newest's).
    ...FILMS.map((f) => ({
      url: new URL(filmHref(f), siteUrl()).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
