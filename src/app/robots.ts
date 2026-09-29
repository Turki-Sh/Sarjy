import type { MetadataRoute } from "next";
import { siteUrl } from "@/shared/site";

// A Majlis (room) is a private invitation and APIs are not pages, so crawlers skip both.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/majlis/"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
