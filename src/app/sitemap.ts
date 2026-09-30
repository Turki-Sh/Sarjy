import type { MetadataRoute } from "next";
import { siteUrl } from "@/shared/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl().toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("/handbook", siteUrl()).toString(), changeFrequency: "weekly", priority: 0.5 },
  ];
}
