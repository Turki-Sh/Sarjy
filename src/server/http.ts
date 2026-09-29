import "server-only";

// Small helpers shared by the API routes: who is calling, and a hashed IP for rate limits.

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getDb } from "./db/client";
import { resolveUser, sessionCookie, SESSION_COOKIE } from "./session";

/** The calling user, created on first contact. Sets the cookie when a new user was made. */
export async function currentUser(uiLang: "en" | "ar" = "en") {
  const db = await getDb();
  const jar = await cookies();
  const { user, created } = await resolveUser(db, jar.get(SESSION_COOKIE)?.value, uiLang);
  if (created) jar.set(sessionCookie(user.id));
  return { db, user };
}

/** A one-way hash of the caller's IP, so limits work without storing addresses. */
export async function ipHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
  return createHash("sha256").update(ip).digest("base64url").slice(0, 16);
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });
