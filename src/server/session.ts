import "server-only";

// Anonymous identity (architecture, section 7). No login: the browser holds a cookie with the
// user's id and an HMAC signature. A missing or tampered cookie means a new visitor.

import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Db } from "./db/client";
import { users, type User } from "./db/schema";
import { env } from "./env";

export const SESSION_COOKIE = "sarjy_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

// Development and tests get a fixed secret; production refuses to run without a real one.
function secret(): string {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && env.providers === "live") {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return "sarjy-development-secret-not-for-production-use";
}

const sign = (id: string) => createHmac("sha256", secret()).update(id).digest("base64url");

export function signUserId(id: string): string {
  return `${id}.${sign(id)}`;
}

/** The user id inside a cookie value, or null when the signature does not match. */
export function verifyCookie(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const id = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(id));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return /^[0-9a-f-]{36}$/.test(id) ? id : null;
}

export function sessionCookie(userId: string) {
  return {
    name: SESSION_COOKIE,
    value: signUserId(userId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR,
  };
}

/** Finds the user behind a cookie, or creates a new one. `created` tells the caller to set the cookie. */
export async function resolveUser(
  db: Db,
  cookieValue: string | undefined,
  uiLang: "en" | "ar" = "en",
): Promise<{ user: User; created: boolean }> {
  const id = verifyCookie(cookieValue);
  if (id) {
    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (existing) {
      await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, id));
      return { user: existing, created: false };
    }
  }
  const [user] = await db.insert(users).values({ uiLang }).returning();
  return { user: user!, created: true };
}
