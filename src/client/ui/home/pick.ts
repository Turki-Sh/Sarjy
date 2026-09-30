"use client";

// Picking a Rafeeq from the home page: the same call Settings makes (it also makes you known to
// Sarjy, if you weren't yet), then straight into the voice screen with it.

import type { RafeeqId } from "@/shared/rafeeq";
import { TALK } from "@/shared/site";

export async function pickRafeeq(id: RafeeqId | null, go: (href: string) => void) {
  try {
    await fetch("/api/rafeeq", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rafeeq: id }),
    });
  } finally {
    go(TALK);
  }
}
