import "server-only";

// The Sarjy Handbook is Turki's build notes, so /handbook is locked (Turki, Day 5). Opening
// /handbook?key=<HANDBOOK_KEY> once leaves a cookie that keeps it open in that browser for 30 days
// (the gate is proxy.ts); anyone else gets the ordinary 404. With no key set it stays shut.

import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { env } from "./env";

export const HANDBOOK_COOKIE = "sarjy_handbook";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// The cookie holds a stamp made from the key, never the key: changing the key closes every
// browser that had the old one.
const stamp = (key: string) => createHmac("sha256", key).update("sarjy-handbook").digest("base64url");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Whether a key typed into the address is the right one. */
export function keyOpens(given: string | null): boolean {
  return Boolean(env.HANDBOOK_KEY && given && same(stamp(given), stamp(env.HANDBOOK_KEY)));
}

/** Whether this browser was let in before. */
export function cookieOpens(value: string | undefined): boolean {
  return Boolean(env.HANDBOOK_KEY && value && same(value, stamp(env.HANDBOOK_KEY)));
}

export function handbookCookie() {
  return {
    name: HANDBOOK_COOKIE,
    value: stamp(env.HANDBOOK_KEY!),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/handbook",
    maxAge: THIRTY_DAYS,
  };
}

/** The generated page (pnpm handbook, also run by every build), or null if it was not built. */
export async function readHandbook(): Promise<string | null> {
  try {
    return await readFile(join(process.cwd(), "docs", "handbook.html"), "utf8");
  } catch {
    return null;
  }
}
