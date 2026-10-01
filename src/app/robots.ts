import type { MetadataRoute } from "next";
import { siteUrl } from "@/shared/site";

// A Majlis (room) and a shared moment are link-only, the handbook is private, and APIs are not
// pages, so crawlers skip them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/majlis/", "/s/", "/handbook"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
