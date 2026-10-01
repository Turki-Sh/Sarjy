// Any address that matches no page. People and search engines get the real 404 (not-found.tsx).
// A link-preview bot gets the same page with a 200, because those bots draw no card for a 404,
// and a wrong link shared in a chat should still show the playful "This page isn't real." card
// (Turki, Day 5). The page says noindex either way.

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isPreviewBot } from "@/shared/previewBots";
import NotFound, { generateMetadata as lostMetadata } from "../not-found";

export const generateMetadata = lostMetadata;

export default async function Missing() {
  if (!isPreviewBot((await headers()).get("user-agent"))) notFound();
  return <NotFound />;
}
