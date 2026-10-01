import type { MetadataRoute } from "next";
import { siteUrl, TALK } from "@/shared/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl().toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL(TALK, siteUrl()).toString(), changeFrequency: "weekly", priority: 0.8 },
    { url: new URL("/film", siteUrl()).toString(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
