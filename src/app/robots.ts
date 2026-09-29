import type { MetadataRoute } from "next";
import { siteUrl } from "@/shared/site";

// Rooms are private invitations and APIs are not pages, so crawlers skip both.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/r/"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
