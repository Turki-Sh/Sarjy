// Turns a photo from your computer into a small square profile picture, in the browser.
// Only the result (about 10 KB) is uploaded: the original never leaves your device.

import { UPLOAD } from "@/shared/avatars";

/** Photos bigger than this are refused before decoding (a phone photo is 3 to 8 MB). */
const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** A centered square crop, scaled to 192 px, as a data URL; null if the file can't be read. */
export async function shrinkImage(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/") || file.size > MAX_FILE_BYTES) return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null; // a format the browser can't decode (for example HEIC outside Safari)
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = UPLOAD.size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    UPLOAD.size,
    UPLOAD.size,
  );
  bitmap.close();
  // WebP where the browser can encode it (smaller), JPEG otherwise (Safari).
  let url = canvas.toDataURL("image/webp", 0.85);
  if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/jpeg", 0.85);
  return url.length <= UPLOAD.maxChars ? url : canvas.toDataURL("image/jpeg", 0.6);
}
