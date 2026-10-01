import type { MetadataRoute } from "next";
import { FEATURED, FILMS } from "@/shared/films";
import { siteUrl, TALK } from "@/shared/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl().toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL(TALK, siteUrl()).toString(), changeFrequency: "weekly", priority: 0.8 },
    { url: new URL("/film", siteUrl()).toString(), changeFrequency: "monthly", priority: 0.6 },
    // Every film but the newest, which is /film itself.
    ...FILMS.filter((f) => f.id !== FEATURED.id).map((f) => ({
      url: new URL(`/film/${f.id}`, siteUrl()).toString(),
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  ];
}
