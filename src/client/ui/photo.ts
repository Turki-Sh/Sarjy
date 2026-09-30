// Turns a picture you drop, paste or take into something small enough to send: the long side at
// most 1280 px, JPEG. A phone photo of 3 to 8 MB becomes about 150 to 300 KB, so the turn stays fast.

const LONGEST = 1280;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function shrinkPhoto(file: File): Promise<Blob | null> {
  if (!file.type.startsWith("image/") || file.size > MAX_FILE_BYTES) return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null; // a format this browser can't decode
  }
  const scale = Math.min(1, LONGEST / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85));
}
