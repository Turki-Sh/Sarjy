// GET: a Majlis's events as a server-sent event stream, for the local transport (tests, offline,
// no Ably key). Having it open is being present. With Ably configured, browsers go to Ably instead
// and this is not found.

import { currentUser, json } from "@/server/http";
import { getRealtime } from "@/server/realtime";
import { listenLocal } from "@/server/realtime/local";
import { memberRoom } from "@/server/rooms/access";
import type { RoomEvent } from "@/shared/room";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

/** A comment line now and then keeps proxies from closing a quiet stream. */
const KEEPALIVE_MS = 15_000;

export async function GET(request: Request, { params }: Params) {
  if (getRealtime().transport !== "local") return json({ error: "not_found" }, 404);
  const { db, user } = await currentUser();
  const room = await memberRoom(db, (await params).code, user.id);
  if (!room || room.endedAt) return json({ error: "not_found" }, 404);

  const encoder = new TextEncoder();
  let leave = () => {};
  let keepalive = 0 as unknown as ReturnType<typeof setInterval>;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          leave(); // the browser went away between two events
        }
      };
      leave = listenLocal(room.code, user.id, (event: RoomEvent) =>
        write(`data: ${JSON.stringify(event)}\n\n`),
      );
      keepalive = setInterval(() => write(": keepalive\n\n"), KEEPALIVE_MS);
      request.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        leave();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      clearInterval(keepalive);
      leave();
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
