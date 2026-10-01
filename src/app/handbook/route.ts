// /handbook: the Sarjy Handbook. The gate is in proxy.ts; only someone it let through gets here.
// The cookie is checked again anyway, so the page never depends on the gate alone.

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cookieOpens, HANDBOOK_COOKIE, readHandbook } from "@/server/handbook";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  if (!cookieOpens(jar.get(HANDBOOK_COOKIE)?.value)) notFound();
  const html = await readHandbook();
  if (!html) notFound();
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
