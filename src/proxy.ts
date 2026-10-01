// The gate in front of /handbook (server/handbook.ts). With the key in the address: swap it for a
// cookie and clean the address, so the key never sits in history or gets shared by accident.
// Without the key or the cookie: show the ordinary 404, the same page as any other wrong address.

import { NextResponse, type NextRequest } from "next/server";
import { cookieOpens, handbookCookie, HANDBOOK_COOKIE, keyOpens } from "@/server/handbook";

/** A path that matches nothing, so the app answers with its own 404 page. */
const NOWHERE = "/handbook-is-private";

export function proxy(req: NextRequest) {
  const given = req.nextUrl.searchParams.get("key");
  if (given !== null && keyOpens(given)) {
    const clean = NextResponse.redirect(new URL("/handbook", req.url), 303);
    clean.cookies.set(handbookCookie());
    clean.headers.set("cache-control", "private, no-store");
    return clean;
  }
  if (given === null && cookieOpens(req.cookies.get(HANDBOOK_COOKIE)?.value)) return NextResponse.next();
  return NextResponse.rewrite(new URL(NOWHERE, req.url));
}

export const config = { matcher: "/handbook" };
