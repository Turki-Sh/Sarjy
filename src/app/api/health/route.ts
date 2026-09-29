// A quick check before a demo: which pieces are configured. Booleans only, never values.

import { configured } from "@/server/env";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, ...configured() }, { headers: { "cache-control": "no-store" } });
}
