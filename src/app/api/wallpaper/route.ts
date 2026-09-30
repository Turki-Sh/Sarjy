// Your own wallpaper (Settings, Appearance).
// PUT: the picture, already shrunk in the browser, as the request body. Returns its version.
// GET: your picture, for the background. Only ever your own; with none, not found. The address
//      carries the version (?v=), so the browser may keep it for as long as it likes.

import { currentUser, json } from "@/server/http";
import { getWallpaper, saveWallpaper } from "@/server/wallpaper/repo";
import { OWN_WALLPAPER_MAX_BYTES } from "@/shared/wallpapers";

export const dynamic = "force-dynamic";

/** The picture's real type, read from its first bytes (the declared type is not trusted). */
function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const text = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function PUT(request: Request) {
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > OWN_WALLPAPER_MAX_BYTES) return json({ error: "too_big" }, 413);
  const mediaType = sniff(bytes);
  if (!mediaType) return json({ error: "not_an_image" }, 415);
  const { db, user } = await currentUser();
  const version = await saveWallpaper(db, user.id, bytes, mediaType);
  return json({ version });
}

export async function GET() {
  const { db, user } = await currentUser();
  const found = await getWallpaper(db, user.id);
  if (!found) return json({ error: "not_found" }, 404);
  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "Content-Type": found.mediaType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
