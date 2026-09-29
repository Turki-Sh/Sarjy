// Packs mono audio samples (-1 to 1) into a 16-bit PCM WAV file.
// Used by the browser for the mic recording and by the fake voice in tests.

export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));

  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true); // format chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);

  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
  return buffer;
}

/**
 * Rewrites the two length fields of a WAV file to match the bytes actually there.
 * Groq's voice streams its WAV, so the header is written before the length is known and claims
 * about 24 hours of audio. Some decoders trust that and fail or wait; the fixed file plays everywhere.
 * Anything that is not a RIFF/WAVE file is returned untouched.
 */
export function fixWavHeader(wav: ArrayBuffer): ArrayBuffer {
  const view = new DataView(wav);
  const tag = (offset: number) => String.fromCharCode(...new Uint8Array(wav, offset, 4));
  if (wav.byteLength < 44 || tag(0) !== "RIFF" || tag(8) !== "WAVE") return wav;

  view.setUint32(4, wav.byteLength - 8, true);
  // Walk the chunks (fmt, maybe LIST, then data) to find where the samples start.
  let offset = 12;
  while (offset + 8 <= wav.byteLength) {
    if (tag(offset) === "data") {
      view.setUint32(offset + 4, wav.byteLength - offset - 8, true);
      break;
    }
    const size = view.getUint32(offset + 4, true);
    offset += 8 + size + (size % 2); // chunks are padded to an even length
  }
  return wav;
}
