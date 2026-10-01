import "server-only";

// Ably, for production (architecture, section 13). Vercel Functions can't hold a WebSocket, so the
// server publishes with one HTTPS call to Ably's REST API, and browsers connect to Ably directly
// with a short-lived token request signed here. The key never leaves the server.

import { createHmac, randomBytes } from "node:crypto";
import { channelName } from "@/shared/room";
import type { Realtime } from "./types";

const REST = "https://rest.ably.io";
/** How long a browser's token lasts; the Ably client asks for a new one by itself before then. */
const TOKEN_TTL_MS = 60 * 60 * 1000;

export function ablyRealtime(key: string): Realtime {
  const [keyName, secret] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
  const auth = `Basic ${Buffer.from(key).toString("base64")}`;

  return {
    transport: "ably",

    async publish(code, event) {
      const res = await fetch(`${REST}/channels/${encodeURIComponent(channelName(code))}/messages`, {
        method: "POST",
        headers: { authorization: auth, "content-type": "application/json" },
        body: JSON.stringify({ name: event.type, data: event }),
      });
      if (!res.ok) throw new Error(`Ably publish failed: ${res.status}`);
    },

    // Who is in the room now: the browsers that entered the channel's presence (each as its user id).
    async present(code) {
      const res = await fetch(`${REST}/channels/${encodeURIComponent(channelName(code))}/presence`, {
        headers: { authorization: auth },
        signal: AbortSignal.timeout(1500),
      });
      if (!res.ok) return null;
      const members = (await res.json()) as { clientId?: string }[];
      return [...new Set(members.map((m) => m.clientId).filter((id): id is string => !!id))];
    },

    // A signed token request (Ably's "TokenRequest"): the browser's Ably client sends it to Ably,
    // which checks the signature and issues a token with exactly these rights.
    async token(code, userId) {
      const request = {
        keyName,
        ttl: TOKEN_TTL_MS,
        capability: JSON.stringify({ [channelName(code)]: ["presence", "subscribe"] }),
        clientId: userId,
        timestamp: Date.now(),
        nonce: randomBytes(16).toString("hex"),
      };
      const signed = [
        request.keyName,
        request.ttl,
        request.capability,
        request.clientId,
        request.timestamp,
        request.nonce,
      ].join("\n");
      const mac = createHmac("sha256", secret).update(`${signed}\n`).digest("base64");
      return { ...request, mac };
    },
  };
}
